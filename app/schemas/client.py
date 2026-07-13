from sqlmodel import SQLModel
from typing import Optional


class ClientCreate(SQLModel):
    name: str
    industry: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ClientRead(SQLModel):
    id: int
    name: str
    industry: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ClientContactCreate(SQLModel):
    client_id: int
    name: str
    email: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None


class ClientContactRead(SQLModel):
    id: int
    client_id: int
    name: str
    email: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
