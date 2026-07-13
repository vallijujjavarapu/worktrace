from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    status: str = Field(default="todo")
    # Values: todo, in_progress, blocked, done
    priority: str = Field(default="medium")
    # Values: low, medium, high

    project_id: int = Field(foreign_key="project.id")
    requirement_id: Optional[int] = Field(default=None)
    # FK to requirement added in Tier 2

    deliverable_link: Optional[str] = None
    # Plain URL - Google Drive, SharePoint, etc.

    created_by: int = Field(foreign_key="employee.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TaskAssignee(SQLModel, table=True):
    """
    Many-to-many: task <-> employee.
    Tracks WHO worked on a task, not just who owns it.
    This is what makes contribution history real -
    multiple people can be credited for one task.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    employee_id: int = Field(foreign_key="employee.id")
    role_on_task: Optional[str] = None
    # e.g. "owner", "reviewer", "contributor"


class TaskActivityLog(SQLModel, table=True):
    """
    Append-only audit trail for every task change.
    NO update endpoint exists for this table - entries
    are only ever inserted, never modified or deleted.
    This is the core of 'preserving contribution history'.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    employee_id: int = Field(foreign_key="employee.id")
    action_type: str
    # e.g. "status_changed", "assignee_added", "deliverable_uploaded", "comment"
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    note: Optional[str] = None
    # Free text - useful for comments and context
    created_at: datetime = Field(default_factory=datetime.utcnow)
