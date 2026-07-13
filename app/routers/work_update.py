from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List
from datetime import date

from app.database import get_session
from app.models.work_update import WorkUpdate
from app.schemas.work_update import WorkUpdateCreate, WorkUpdateRead
from app.core.deps import get_current_user, get_scope
from app.models.employee import Employee
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/updates", tags=["Work Updates"])


@router.post("/", response_model=WorkUpdateRead)
def create_update(
    data: WorkUpdateCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    update = WorkUpdate(
        employee_id=current_user.id,
        update_text=data.update_text,
        blockers=data.blockers,
        project_id=data.project_id,
        task_id=data.task_id,
        update_date=data.update_date or date.today(),
    )
    session.add(update)
    session.commit()
    session.refresh(update)
    return update


@router.get("/", response_model=List[WorkUpdateRead])
def get_updates(
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
    current_user: Employee = Depends(get_current_user),
):
    if scope.is_admin:
        return session.exec(select(WorkUpdate)).all()

    if current_user.role in ("manager", "department_head"):
        # Get visible team members
        visible_employees = session.exec(
            select(Employee).where(Employee.team_id.in_(scope.team_ids))
        ).all()
        visible_ids = [e.id for e in visible_employees]

        # Always include the manager's own updates too
        if current_user.id not in visible_ids:
            visible_ids.append(current_user.id)

        return session.exec(
            select(WorkUpdate).where(WorkUpdate.employee_id.in_(visible_ids))
        ).all()

    return session.exec(
        select(WorkUpdate).where(WorkUpdate.employee_id == current_user.id)
    ).all()


@router.get("/my", response_model=List[WorkUpdateRead])
def get_my_updates(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    return session.exec(
        select(WorkUpdate).where(WorkUpdate.employee_id == current_user.id)
    ).all()
