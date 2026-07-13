from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.schemas.task import (
    MyProgressTaskOut,
)  # adjust path to wherever it actually lives
from app.database import get_session
from app.models.task import Task, TaskAssignee, TaskActivityLog
from app.models.project import ProjectTeam
from app.models.employee import Employee
from app.schemas.task import (
    TaskCreate,
    TaskRead,
    TaskReadWithAssignees,
    TaskUpdate,
    TaskAssigneeAdd,
    ActivityLogRead,
    TaskComment,
)
from app.core.deps import get_current_user, get_scope
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _log(
    session: Session,
    task_id: int,
    employee_id: int,
    action_type: str,
    old_value: str = None,
    new_value: str = None,
    note: str = None,
):
    """
    Internal helper to append an activity log entry.
    Called any time something meaningful changes on a task.
    Never called with an update - only inserts.
    """
    entry = TaskActivityLog(
        task_id=task_id,
        employee_id=employee_id,
        action_type=action_type,
        old_value=old_value,
        new_value=new_value,
        note=note,
    )
    session.add(entry)


def _assert_project_visible(project_id: int, scope: VisibleScope, session: Session):
    """Check if the current user's scope includes this project."""
    if scope.is_admin:
        return
    rows = session.exec(
        select(ProjectTeam).where(ProjectTeam.project_id == project_id)
    ).all()
    project_team_ids = {row.team_id for row in rows}
    if not project_team_ids.intersection(set(scope.team_ids)):
        raise HTTPException(
            status_code=403, detail="Not authorized to access this project"
        )


@router.post("/", response_model=TaskReadWithAssignees)
def create_task(
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    # Must be able to see the project to create tasks in it
    _assert_project_visible(task_data.project_id, scope, session)

    task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        project_id=task_data.project_id,
        requirement_id=task_data.requirement_id,
        deliverable_link=task_data.deliverable_link,
        created_by=current_user.id,
    )
    session.add(task)
    session.flush()  # get task.id

    # Add assignees
    assignee_ids = []
    for emp_id in task_data.assignee_ids:
        if not session.get(Employee, emp_id):
            raise HTTPException(status_code=404, detail=f"Employee {emp_id} not found")
        session.add(TaskAssignee(task_id=task.id, employee_id=emp_id))
        assignee_ids.append(emp_id)
        _log(session, task.id, current_user.id, "assignee_added", new_value=str(emp_id))

    # Log task creation
    _log(session, task.id, current_user.id, "task_created", new_value=task_data.title)

    session.commit()
    session.refresh(task)
    return TaskReadWithAssignees(**task.model_dump(), assignee_ids=assignee_ids)


@router.get("/", response_model=List[TaskReadWithAssignees])
def get_tasks(
    project_id: int = None,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    """
    List tasks. Optionally filter by project_id.
    Always filtered by the caller's visibility scope.
    """
    # Get visible project IDs from scope
    if scope.is_admin:
        visible_project_ids = None
    else:
        rows = session.exec(
            select(ProjectTeam).where(ProjectTeam.team_id.in_(scope.team_ids))
        ).all()
        visible_project_ids = list({row.project_id for row in rows})

    query = select(Task)

    if project_id:
        # If filtering by specific project, check access first
        if visible_project_ids is not None and project_id not in visible_project_ids:
            raise HTTPException(status_code=403, detail="Not authorized")
        query = query.where(Task.project_id == project_id)
    elif visible_project_ids is not None:
        if not visible_project_ids:
            return []
        query = query.where(Task.project_id.in_(visible_project_ids))

    tasks = session.exec(query).all()

    result = []
    for task in tasks:
        assignees = session.exec(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id)
        ).all()
        result.append(
            TaskReadWithAssignees(
                **task.model_dump(), assignee_ids=[a.employee_id for a in assignees]
            )
        )
    return result


@router.get("/{task_id}", response_model=TaskReadWithAssignees)
def get_task(
    task_id: int,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_visible(task.project_id, scope, session)

    assignees = session.exec(
        select(TaskAssignee).where(TaskAssignee.task_id == task_id)
    ).all()
    return TaskReadWithAssignees(
        **task.model_dump(), assignee_ids=[a.employee_id for a in assignees]
    )


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_visible(task.project_id, scope, session)

    updates = task_data.model_dump(exclude_unset=True)
    for field, new_value in updates.items():
        old_value = getattr(task, field)
        setattr(task, field, new_value)

        # Log every field change individually so history is granular
        _log(
            session,
            task.id,
            current_user.id,
            action_type=f"{field}_changed",
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
        )

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.post("/{task_id}/assignees", response_model=TaskReadWithAssignees)
def add_assignee(
    task_id: int,
    data: TaskAssigneeAdd,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_visible(task.project_id, scope, session)

    # Check not already assigned
    existing = session.exec(
        select(TaskAssignee).where(
            TaskAssignee.task_id == task_id,
            TaskAssignee.employee_id == data.employee_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Employee already assigned to this task"
        )

    if not session.get(Employee, data.employee_id):
        raise HTTPException(status_code=404, detail="Employee not found")

    session.add(
        TaskAssignee(
            task_id=task_id,
            employee_id=data.employee_id,
            role_on_task=data.role_on_task,
        )
    )
    _log(
        session,
        task_id,
        current_user.id,
        "assignee_added",
        new_value=str(data.employee_id),
    )
    session.commit()

    assignees = session.exec(
        select(TaskAssignee).where(TaskAssignee.task_id == task_id)
    ).all()
    return TaskReadWithAssignees(
        **task.model_dump(), assignee_ids=[a.employee_id for a in assignees]
    )


@router.post("/{task_id}/comment", response_model=ActivityLogRead)
def add_comment(
    task_id: int,
    data: TaskComment,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    """Add a freetext update/comment to the task activity log."""
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_visible(task.project_id, scope, session)

    entry = TaskActivityLog(
        task_id=task_id,
        employee_id=current_user.id,
        action_type="comment",
        note=data.note,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.get("/{task_id}/history", response_model=List[ActivityLogRead])
def get_task_history(
    task_id: int,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    """
    Full activity history for a task - every status change,
    assignee addition, deliverable upload, and comment ever made.
    This is the contribution history that makes individual work visible.
    """
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_visible(task.project_id, scope, session)

    logs = session.exec(
        select(TaskActivityLog)
        .where(TaskActivityLog.task_id == task_id)
        .order_by(TaskActivityLog.created_at)
    ).all()
    return logs


@router.get(
    "/projects/{project_id}/my-progress", response_model=List[MyProgressTaskOut]
)
def get_my_work_progress(
    project_id: int,
    current_user: Employee = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Personal-only endpoint. Returns ONLY tasks assigned to the requesting user
    within the given project. Deliberately does NOT go through the visibility
    resolver — this is self-tracking data, not org-scoped data. Even Admins
    only see their own tasks here.
    """
    tasks = session.exec(
        select(Task)
        .where(Task.project_id == project_id)
        .join(TaskAssignee)
        .where(TaskAssignee.employee_id == current_user.id)
    ).all()

    result = []
    for task in tasks:
        # Pull the "assignee_added" log entry for THIS employee on THIS task.
        # Ordered by created_at so if somehow logged twice, we take the first.
        assign_log = session.exec(
            select(TaskActivityLog)
            .where(TaskActivityLog.task_id == task.id)
            .where(TaskActivityLog.employee_id == current_user.id)
            .where(TaskActivityLog.action_type == "assignee_added")
            .order_by(TaskActivityLog.created_at)
        ).first()

        result.append(
            MyProgressTaskOut(
                id=task.id,
                title=task.title,
                status=task.status,
                assigned_at=assign_log.created_at if assign_log else None,
            )
        )

    return result
