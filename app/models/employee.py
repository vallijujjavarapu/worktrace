from typing import Optional
from sqlmodel import SQLModel, Field


class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str
    designation: Optional[str] = None  # e.g. "Senior Developer", "Product Manager"
    team_id: Optional[int] = Field(default=None, foreign_key="team.id", nullable=True)
    is_active: bool = Field(default=True)
