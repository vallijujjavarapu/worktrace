from typing import Optional
from sqlmodel import SQLModel, Field


class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    industry: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ClientContact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(foreign_key="client.id")
    name: str
    email: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
