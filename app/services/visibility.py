from sqlmodel import Session, select
from app.models.employee import Employee
from app.models.team import Team


class VisibleScope:
    """
    Represents what a logged-in user is authorized to see.
    Every list endpoint filters against team_ids or employee_ids from this object.
    """

    def __init__(self, team_ids: list[int], is_admin: bool = False):
        self.team_ids = team_ids
        self.is_admin = is_admin


def get_visible_scope(user: Employee, db: Session) -> VisibleScope:
    """
    The single source of truth for access control in WorkTrace.
    Given a logged-in user, compute exactly which teams they can see.
    Every module's list endpoint calls this before querying data.

    We resolve from explicit FK relationships (team.manager_id,
    team.department_id) rather than a generic tree traversal, because
    our hierarchy is fixed depth with named relationships - simpler
    and faster.
    """
    role = user.role

    if role == "admin":
        # Admin sees everything - no filter needed
        return VisibleScope(team_ids=[], is_admin=True)

    if role in ("employee", "team_lead"):
        # Can only see their own team
        if user.team_id is None:
            return VisibleScope(team_ids=[])
        return VisibleScope(team_ids=[user.team_id])

    if role == "manager":
        # Sees all teams where they are assigned as manager
        teams = db.exec(select(Team).where(Team.manager_id == user.id)).all()
        return VisibleScope(team_ids=[t.id for t in teams])

    if role == "department_head":
        # Find the department this person heads via department.department_head_id
        from app.models.department import Department

        dept = db.exec(
            select(Department).where(Department.department_head_id == user.id)
        ).first()

        if not dept:
            return VisibleScope(team_ids=[])

        teams = db.exec(select(Team).where(Team.department_id == dept.id)).all()
        return VisibleScope(team_ids=[t.id for t in teams])
    # Unknown role - see nothing
    return VisibleScope(team_ids=[])
