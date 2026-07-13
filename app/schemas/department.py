from sqlmodel import SQLModel
from typing import Optional


class DepartmentCreate(SQLModel):
    name: str
    description: str
    department_head_id: Optional[int] = None


class DepartmentRead(SQLModel):
    id: int
    name: str
    description: str
    department_head_id: Optional[int] = None


class DepartmentUpdate(SQLModel):
    name: str
    description: str
    department_head_id: Optional[int] = None


class DepartmentPatch(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_head_id: Optional[int] = None
