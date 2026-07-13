from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, Token
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, session: Session = Depends(get_session)):
    employee = session.exec(
        select(Employee).where(Employee.email == credentials.email)
    ).first()

    # Identical error for "no such email" and "wrong password" - don't let
    # the response tell an attacker which one it was.
    if not employee or not verify_password(
        credentials.password, employee.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    token = create_access_token(employee_id=employee.id, role=employee.role)
    return Token(access_token=token)
