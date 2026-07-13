from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
import anthropic
import json

from app.database import get_session
from app.models.work_update import WorkUpdate
from app.models.employee import Employee
from app.models.project import Project
from app.core.deps import get_current_user, get_scope
from app.services.visibility import VisibleScope
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI"])

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


class SummaryRequest(BaseModel):
    pass


class TaskDescRequest(BaseModel):
    title: str


class RequirementAnalysisRequest(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_notes: Optional[str] = None


@router.post("/team-summary")
def generate_team_summary(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")

    if scope.is_admin:
        visible_employees = session.exec(select(Employee)).all()
    else:
        visible_employees = session.exec(
            select(Employee).where(Employee.team_id.in_(scope.team_ids))
        ).all()

    emp_map = {e.id: e.name for e in visible_employees}
    visible_emp_ids = list(emp_map.keys())

    if not visible_emp_ids:
        return {"summary": "No team members visible to your account."}

    updates = session.exec(
        select(WorkUpdate).where(WorkUpdate.employee_id.in_(visible_emp_ids))
    ).all()

    if not updates:
        return {"summary": "No work updates found from your team."}

    projects = session.exec(select(Project)).all()
    proj_map = {p.id: p.name for p in projects}

    formatted = []
    for u in updates:
        emp_name = emp_map.get(u.employee_id, "Unknown")
        proj_name = proj_map.get(u.project_id, "General") if u.project_id else "General"
        date = u.update_date.strftime("%b %d") if u.update_date else "Recent"
        blocker = f" BLOCKER: {u.blockers}" if u.blockers else ""
        formatted.append(
            f"- {emp_name} ({proj_name}, {date}): {u.update_text}{blocker}"
        )

    updates_text = "\n".join(formatted)

    prompt = f"""You are an intelligent work intelligence assistant for an enterprise platform called WorkTrace.

The following are work updates from a team reporting to {current_user.name}. Generate a clear, professional executive summary. Include:
1. Key accomplishments this period
2. Work in progress  
3. Any blockers that need attention
4. Overall team momentum (1-2 sentences)

Keep it concise — under 200 words. Write in third person. Start directly with the summary, no preamble.

Team updates:
{updates_text}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        summary = message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {"summary": summary}


@router.post("/generate-task-description")
def generate_task_description(
    data: TaskDescRequest,
    current_user: Employee = Depends(get_current_user),
):
    prompt = f"""Generate a clear, professional task description for an enterprise project management system.
Task title: "{data.title}"
Write 2-3 sentences covering what needs to be done, why it matters, and what the expected output is. Be specific and actionable. No bullet points, just prose."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        description = message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {"description": description}


@router.post("/analyze-requirement")
def analyze_requirement(
    data: RequirementAnalysisRequest,
    current_user: Employee = Depends(get_current_user),
):
    prompt = f"""You are a project manager analyzing a client requirement for a software project.

Requirement: "{data.title}"
Description: "{data.description or "Not provided"}"
Meeting notes: "{data.meeting_notes or "Not provided"}"

Break this into 3-4 concrete development tasks. Respond ONLY with a JSON array, no other text:
[{{"title": "task title", "priority": "high|medium|low", "description": "what needs to be done"}}]"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    clean = text.replace("```json", "").replace("```", "").strip()

    try:
        tasks = json.loads(clean)
        return {"tasks": tasks}
    except Exception:
        return {"tasks": []}
