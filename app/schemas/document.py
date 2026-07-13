from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime


class DocumentRead(SQLModel):
    id: int
    project_id: int
    uploaded_by: int
    title: str
    original_filename: str
    file_size: int
    mime_type: str
    category: Optional[str] = None
    uploaded_at: datetime
