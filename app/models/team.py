from typing import Optional
from sqlmodel import SQLModel, Field


class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    department_id: int = Field(foreign_key="department.id", nullable=False)

    team_lead_id: Optional[int] = Field(
        default=None, foreign_key="employee.id", nullable=True
    )
    manager_id: Optional[int] = Field(
        default=None, foreign_key="employee.id", nullable=True
    )
