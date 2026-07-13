from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import date


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    status: str = Field(default="active")
    # Values: planned, active, on_hold, completed

    start_date: Optional[date] = None
    target_end_date: Optional[date] = None

    department_id: int = Field(foreign_key="department.id")
    client_id: Optional[int] = Field(default=None)
    # We'll add FK when Client model exists in Tier 2

    created_by: int = Field(foreign_key="employee.id")


class ProjectTeam(SQLModel, table=True):
    """
    Junction table linking projects to teams.
    Many-to-many: one project can involve multiple teams,
    one team can work on multiple projects.
    This is also what the visibility resolver uses:
    'can this user see this project?' =
    'does any of their visible teams appear in project_team?'
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    team_id: int = Field(foreign_key="team.id")
