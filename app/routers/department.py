from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from sqlmodel import select
from typing import List
from app.models.employee import Employee
from app.core.deps import get_current_user
from app.database import get_session
from app.models.department import Department
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentRead,
    DepartmentPatch,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(department_id: int, session: Session = Depends(get_session)):
    department = session.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.get("/", response_model=List[DepartmentRead])
def get_departments(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    return session.exec(select(Department)).all()


@router.put("/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: int,
    department_update: DepartmentUpdate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    department = session.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    department.name = department_update.name
    department.description = department_update.description
    department.department_head_id = department_update.department_head_id
    session.add(department)
    session.commit()
    session.refresh(department)
    return department


@router.patch("/{department_id}", response_model=DepartmentRead)
def patch_department(
    department_id: int,
    department_update: DepartmentPatch,
    session: Session = Depends(get_session),
):
    department = session.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    for field, value in department_update.model_dump(exclude_unset=True).items():
        setattr(department, field, value)

    session.add(department)
    session.commit()
    session.refresh(department)
    return department


@router.post("/", response_model=DepartmentRead)
def create_department(
    department: DepartmentCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can create departments"
        )
    db_department = Department(
        name=department.name,
        description=department.description,
        department_head_id=department.department_head_id,
    )
    session.add(db_department)
    session.commit()
    session.refresh(db_department)
    return db_department


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can delete departments"
        )
    department = session.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    session.delete(department)
    session.commit()
    return {"message": "Department deleted successfully"}
