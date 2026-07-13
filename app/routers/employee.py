from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.employee import Employee
from app.models.team import Team
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeePatch,
    EmployeeRead,
)
from app.core.deps import get_current_user, get_scope
from app.core.security import hash_password
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("/me", response_model=EmployeeRead)
def get_my_profile(current_user: Employee = Depends(get_current_user)):
    return current_user


@router.get("/all", response_model=List[EmployeeRead])
def get_all_employees_public(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    """
    Returns all employees for the People directory.
    Everyone can search everyone — this is intentional.
    Visibility rules apply to project/task data, not to
    knowing who works in the company.
    """
    return session.exec(select(Employee)).all()


@router.post("/register", response_model=EmployeeRead)
def register_employee(
    employee_data: EmployeeCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    """Only admins and managers can register new employees."""
    if current_user.role not in ("admin", "department_head", "manager"):
        raise HTTPException(
            status_code=403, detail="Not authorized to register employees"
        )

    # Check email not already taken
    existing = session.exec(
        select(Employee).where(Employee.email == employee_data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    _validate_team(employee_data.team_id, session)

    employee = Employee(
        name=employee_data.name,
        email=employee_data.email,
        role=employee_data.role,
        team_id=employee_data.team_id,
        designation=employee_data.designation,
        password_hash=hash_password(employee_data.password),
    )
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


def _validate_team(team_id: int | None, session: Session):
    if team_id is not None and not session.get(Team, team_id):
        raise HTTPException(status_code=404, detail="Team not found")


@router.get("/search", response_model=List[EmployeeRead])
def search_employees(
    q: str,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    results = session.exec(
        select(Employee).where(Employee.name.contains(q) | Employee.email.contains(q))
    ).all()
    return results


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, session: Session = Depends(get_session)):
    employee = session.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.get("/", response_model=List[EmployeeRead])
def get_employees(
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    """
    Returns employees filtered by the caller's visibility scope.
    An admin sees all employees. Everyone else only sees employees
    whose team_id is in their authorized scope.
    """
    if scope.is_admin:
        return session.exec(select(Employee)).all()

    return session.exec(
        select(Employee).where(Employee.team_id.in_(scope.team_ids))
    ).all()


@router.post("/", response_model=EmployeeRead)
def create_employee(
    employee_data: EmployeeCreate, session: Session = Depends(get_session)
):
    _validate_team(employee_data.team_id, session)
    employee = Employee(
        name=employee_data.name,
        email=employee_data.email,
        role=employee_data.role,
        team_id=employee_data.team_id,
        designation=employee_data.designation,
        password_hash=hash_password(employee_data.password),
    )
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    session: Session = Depends(get_session),
):
    employee = session.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    _validate_team(employee_data.team_id, session)

    for field, value in employee_data.model_dump().items():
        setattr(employee, field, value)

    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


@router.patch("/edit/{employee_id}", response_model=EmployeeRead)
def admin_edit_employee(
    employee_id: int,
    data: EmployeePatch,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized")

    employee = session.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)

    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, session: Session = Depends(get_session)):
    employee = session.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    session.delete(employee)
    session.commit()
    return {"message": "Employee deleted successfully"}
