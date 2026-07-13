from sqlmodel import SQLModel
from typing import Optional
from datetime import date


class ProjectCreate(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    department_id: int
    team_ids: list[int] = []
    # Which teams are assigned to this project at creation time


class ProjectRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    department_id: int
    created_by: int


class ProjectReadWithTeams(ProjectRead):
    team_ids: list[int] = []


class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None


class ProjectTeamAssign(SQLModel):
    team_ids: list[int]  # Replace all team assignments with this list
