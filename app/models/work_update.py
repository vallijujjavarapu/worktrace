from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import date, datetime


class WorkUpdate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    employee_id: int = Field(foreign_key="employee.id")
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    update_date: date = Field(default_factory=date.today)
    update_text: str
    blockers: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
