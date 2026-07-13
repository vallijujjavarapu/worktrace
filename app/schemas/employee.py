from sqlmodel import SQLModel
from typing import Optional


class EmployeeCreate(SQLModel):
    name: str
    email: str
    password: str
    role: str
    team_id: Optional[int] = None
    designation: Optional[str] = None


class EmployeeRead(SQLModel):
    id: int
    name: str
    email: str
    role: str
    team_id: Optional[int] = None
    is_active: bool
    designation: Optional[str] = None


class EmployeeUpdate(SQLModel):
    name: str
    email: str
    role: str
    team_id: Optional[int] = None
    designation: Optional[str] = None


class EmployeePatch(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[int] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None
