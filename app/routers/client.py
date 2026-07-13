from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.client import Client, ClientContact
from app.schemas.client import (
    ClientCreate,
    ClientRead,
    ClientContactCreate,
    ClientContactRead,
)
from app.core.deps import get_current_user
from app.models.employee import Employee

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/", response_model=List[ClientRead])
def get_clients(
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized to view clients")
    return session.exec(select(Client)).all()


@router.post("/", response_model=ClientRead)
def create_client(
    data: ClientCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    client = Client(**data.model_dump())
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientRead)
def get_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    data: ClientCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete clients")
    client = session.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    session.delete(client)
    session.commit()
    return {"message": "Client deleted"}


@router.post("/{client_id}/contacts", response_model=ClientContactRead)
def add_contact(
    client_id: int,
    data: ClientContactCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if not session.get(Client, client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    contact = ClientContact(**data.model_dump())
    session.add(contact)
    session.commit()
    session.refresh(contact)
    return contact


@router.get("/{client_id}/contacts", response_model=List[ClientContactRead])
def get_contacts(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
):
    if current_user.role not in ("admin", "manager", "department_head"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return session.exec(
        select(ClientContact).where(ClientContact.client_id == client_id)
    ).all()
