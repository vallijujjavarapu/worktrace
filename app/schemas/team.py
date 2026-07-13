from sqlmodel import SQLModel
from typing import Optional


class TeamCreate(SQLModel):
    name: str
    department_id: int
    team_lead_id: Optional[int] = None
    manager_id: Optional[int] = None


class TeamRead(SQLModel):
    id: int
    name: str
    department_id: int
    team_lead_id: Optional[int] = None
    manager_id: Optional[int] = None


class TeamUpdate(TeamCreate):
    pass


class TeamPatch(SQLModel):
    name: Optional[str] = None
    department_id: Optional[int] = None
    team_lead_id: Optional[int] = None
    manager_id: Optional[int] = None


class TeamOut(SQLModel):
    id: int
    name: str
    department_id: Optional[int] = None
    team_lead_id: Optional[int] = None
