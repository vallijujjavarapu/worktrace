from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.project import Project, ProjectTeam
from app.models.team import Team
from app.models.department import Department
from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectReadWithTeams,
    ProjectUpdate,
    ProjectTeamAssign,
)
from app.core.deps import get_current_user, get_scope
from app.models.employee import Employee
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/projects", tags=["Projects"])


def _get_visible_project_ids(scope: VisibleScope, session: Session) -> list[int]:
    """
    Given a visibility scope (set of team_ids), return all project IDs
    that have at least one of those teams assigned to them.
    This is the join that connects 'which teams can I see' to
    'which projects can I see'.
    """
    if scope.is_admin:
        return None  # None signals "no filter needed, see all"

    if not scope.team_ids:
        return []

    rows = session.exec(
        select(ProjectTeam.project_id).where(ProjectTeam.team_id.in_(scope.team_ids))
    ).all()
    return list(
        set(rows)
    )  # deduplicate - project assigned to 2 visible teams shouldn't appear twice


@router.post("/", response_model=ProjectReadWithTeams)
def create_project(
    project_data: ProjectCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "department_head"):
        raise HTTPException(
            status_code=403,
            detail="Only admins and department heads can create projects",
        )

    if not session.get(Department, project_data.department_id):
        raise HTTPException(status_code=404, detail="Department not found")

    project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status,
        start_date=project_data.start_date,
        target_end_date=project_data.target_end_date,
        department_id=project_data.department_id,
        created_by=current_user.id,
    )
    session.add(project)
    session.flush()  # flush to get project.id before creating ProjectTeam rows

    # Assign teams to project
    team_ids = []
    for team_id in project_data.team_ids:
        if not session.get(Team, team_id):
            raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
        session.add(ProjectTeam(project_id=project.id, team_id=team_id))
        team_ids.append(team_id)

    session.commit()
    session.refresh(project)

    return ProjectReadWithTeams(**project.model_dump(), team_ids=team_ids)


@router.get("/", response_model=List[ProjectReadWithTeams])
def get_projects(
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    """
    Returns projects filtered by the caller's visibility scope.
    The resolver tells us which team_ids this user can see,
    we then find all projects that have any of those teams assigned.
    """
    visible_project_ids = _get_visible_project_ids(scope, session)

    if visible_project_ids is None:
        # Admin - see all
        projects = session.exec(select(Project)).all()
    elif not visible_project_ids:
        return []
    else:
        projects = session.exec(
            select(Project).where(Project.id.in_(visible_project_ids))
        ).all()

    # Attach team_ids to each project
    result = []
    for project in projects:
        team_rows = session.exec(
            select(ProjectTeam).where(ProjectTeam.project_id == project.id)
        ).all()
        result.append(
            ProjectReadWithTeams(
                **project.model_dump(), team_ids=[row.team_id for row in team_rows]
            )
        )
    return result


@router.get("/{project_id}", response_model=ProjectReadWithTeams)
def get_project(
    project_id: int,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check visibility
    visible_project_ids = _get_visible_project_ids(scope, session)
    if visible_project_ids is not None and project_id not in visible_project_ids:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this project"
        )

    team_rows = session.exec(
        select(ProjectTeam).where(ProjectTeam.project_id == project_id)
    ).all()

    return ProjectReadWithTeams(
        **project.model_dump(), team_ids=[row.team_id for row in team_rows]
    )


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("manager", "department_head", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update projects")

    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.post("/{project_id}/teams", response_model=ProjectReadWithTeams)
def assign_teams(
    project_id: int,
    data: ProjectTeamAssign,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    """Replace all team assignments for a project with the provided list."""
    if current_user.role not in ("manager", "department_head", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Remove existing assignments
    existing = session.exec(
        select(ProjectTeam).where(ProjectTeam.project_id == project_id)
    ).all()
    for row in existing:
        session.delete(row)

    # Add new assignments
    for team_id in data.team_ids:
        if not session.get(Team, team_id):
            raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
        session.add(ProjectTeam(project_id=project_id, team_id=team_id))

    session.commit()
    session.refresh(project)  # add this line

    return ProjectReadWithTeams(**project.model_dump(), team_ids=data.team_ids)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Only admins can delete projects")

    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    session.delete(project)
    session.commit()
    return {"message": "Project deleted successfully"}
