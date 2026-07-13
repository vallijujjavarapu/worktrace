from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlmodel import select
from typing import List
from app.database import get_session
from app.models.team import Team
from app.models.department import Department
from app.schemas.team import TeamCreate, TeamUpdate, TeamRead, TeamPatch, TeamOut
from app.core.deps import get_current_user, get_scope
from app.models.employee import Employee
from app.models.project import Project, ProjectTeam
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("/bench", response_model=List[TeamOut])
def get_bench_teams(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    """
    Returns teams that are NOT currently assigned to any active project.
    Reads directly from the ProjectTeam junction table — the real
    source of truth for project-team assignment — rather than any
    computed/aggregated field.
    """
    active_project_ids = session.exec(
        select(Project.id).where(Project.status == "active")
    ).all()

    active_team_ids = set(
        session.exec(
            select(ProjectTeam.team_id).where(
                ProjectTeam.project_id.in_(active_project_ids)
            )
        ).all()
    )

    if scope.is_admin:
        all_teams = session.exec(select(Team)).all()
    else:
        all_teams = session.exec(select(Team).where(Team.id.in_(scope.team_ids))).all()

    bench_teams = [t for t in all_teams if t.id not in active_team_ids]
    return bench_teams


@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: int, session: Session = Depends(get_session)):
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/", response_model=List[TeamRead])
def get_teams(session: Session = Depends(get_session)):
    return session.exec(select(Team)).all()


@router.post("/", response_model=TeamRead)
def create_team(
    team_data: TeamCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if not session.get(Department, team_data.department_id):
        raise HTTPException(status_code=404, detail="Department not found")
    team = Team(**team_data.model_dump())
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.put("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not session.get(Department, team_data.department_id):
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in team_data.model_dump().items():
        setattr(team, field, value)
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.patch("/{team_id}", response_model=TeamRead)
def patch_team(
    team_id: int,
    team_data: TeamPatch,
    session: Session = Depends(get_session),
):
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    for field, value in team_data.model_dump(exclude_unset=True).items():
        setattr(team, field, value)

    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Only admins can delete teams")
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    session.delete(team)
    session.commit()
    return {"message": "Team deleted successfully"}
