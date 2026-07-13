from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    uploaded_by: int = Field(foreign_key="employee.id")
    title: str
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    category: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
