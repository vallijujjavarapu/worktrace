from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session

from app.services.visibility import get_visible_scope, VisibleScope

from app.database import get_session
from app.models.employee import Employee
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Employee:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(credentials.credentials)
        employee_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise credentials_error

    employee = session.get(Employee, employee_id)
    if not employee or not employee.is_active:
        raise credentials_error

    return employee


def get_scope(
    current_user: Employee = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> VisibleScope:
    """
    Convenience dependency - gives any route both the current user
    and their computed visible scope in one Depends() call.
    """
    return get_visible_scope(current_user, session)
