from typing import Optional
from sqlmodel import SQLModel, Field


class Department(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str = Field(unique=True, index=True)
    description: str

    # Nullable: a department can exist before someone is assigned to head it.
    # This FK and Team's lead/manager FKs below create a genuine circular
    # reference between tables (Department -> Employee -> Team -> Department) -
    # that's fine, SQLModel/Alembic resolve it automatically since every link
    # in the cycle is nullable.
    department_head_id: Optional[int] = Field(
        default=None, foreign_key="employee.id", nullable=True
    )
