from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Requirement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    status: str = Field(default="open")
    # Values: open, in_progress, completed, cancelled

    project_id: int = Field(foreign_key="project.id")
    owner_id: Optional[int] = Field(default=None, foreign_key="employee.id")
    raised_by_contact_id: Optional[int] = Field(
        default=None, foreign_key="clientcontact.id"
    )

    # False = initial project requirement, True = raised during client meeting
    is_new_requirement: bool = Field(default=False)
    meeting_notes: Optional[str] = (
        None  # context from the meeting where this was raised
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
