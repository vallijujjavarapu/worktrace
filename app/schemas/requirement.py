from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime


class RequirementCreate(SQLModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    project_id: int
    owner_id: Optional[int] = None
    raised_by_contact_id: Optional[int] = None
    is_new_requirement: bool = False
    meeting_notes: Optional[str] = None


class RequirementRead(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    project_id: int
    owner_id: Optional[int] = None
    raised_by_contact_id: Optional[int] = None
    is_new_requirement: bool
    meeting_notes: Optional[str] = None
    created_at: datetime


class RequirementUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None
    meeting_notes: Optional[str] = None
