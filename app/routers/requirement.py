from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.requirement import Requirement
from app.schemas.requirement import (
    RequirementCreate,
    RequirementRead,
    RequirementUpdate,
)
from app.core.deps import get_current_user, get_scope
from app.models.employee import Employee
from app.services.visibility import VisibleScope
from app.models.project import ProjectTeam

router = APIRouter(prefix="/requirements", tags=["Requirements"])


def _check_project_access(project_id: int, scope: VisibleScope, session: Session):
    if scope.is_admin:
        return
    rows = session.exec(
        select(ProjectTeam).where(ProjectTeam.project_id == project_id)
    ).all()
    project_team_ids = {row.team_id for row in rows}
    if not project_team_ids.intersection(set(scope.team_ids)):
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post("/", response_model=RequirementRead)
def create_requirement(
    data: RequirementCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    _check_project_access(data.project_id, scope, session)
    req = Requirement(**data.model_dump())
    session.add(req)
    session.commit()
    session.refresh(req)
    return req


@router.get("/", response_model=List[RequirementRead])
def get_requirements(
    project_id: int = None,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    query = select(Requirement)
    if project_id:
        _check_project_access(project_id, scope, session)
        query = query.where(Requirement.project_id == project_id)
    return session.exec(query).all()


@router.get("/{req_id}", response_model=RequirementRead)
def get_requirement(
    req_id: int,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    req = session.get(Requirement, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    _check_project_access(req.project_id, scope, session)
    return req


@router.patch("/{req_id}", response_model=RequirementRead)
def update_requirement(
    req_id: int,
    data: RequirementUpdate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    req = session.get(Requirement, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    _check_project_access(req.project_id, scope, session)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    session.add(req)
    session.commit()
    session.refresh(req)
    return req
