from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime


class TaskCreate(SQLModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    project_id: int
    requirement_id: Optional[int] = None
    deliverable_link: Optional[str] = None
    assignee_ids: list[int] = []


class TaskRead(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    project_id: int
    requirement_id: Optional[int] = None
    deliverable_link: Optional[str] = None
    created_by: int
    created_at: datetime


class TaskReadWithAssignees(TaskRead):
    assignee_ids: list[int] = []


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deliverable_link: Optional[str] = None
    requirement_id: Optional[int] = None


class TaskAssigneeAdd(SQLModel):
    employee_id: int
    role_on_task: Optional[str] = "contributor"


class ActivityLogRead(SQLModel):
    id: int
    task_id: int
    employee_id: int
    action_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime


class MyProgressTaskOut(SQLModel):
    id: int
    title: str
    status: str
    assigned_at: Optional[datetime] = None


class TaskComment(SQLModel):
    note: str  # For adding a plain comment/update to the activity log
