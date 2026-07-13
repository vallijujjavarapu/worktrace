from sqlmodel import SQLModel
from typing import Optional
from datetime import date, datetime


class WorkUpdateCreate(SQLModel):
    update_text: str
    blockers: Optional[str] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    update_date: Optional[date] = None


class WorkUpdateRead(SQLModel):
    id: int
    employee_id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    update_date: date
    update_text: str
    blockers: Optional[str] = None
    created_at: datetime
