import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.document import Document
from app.models.project import ProjectTeam
from app.schemas.document import DocumentRead
from app.core.deps import get_current_user, get_scope
from app.models.employee import Employee
from app.services.visibility import VisibleScope

router = APIRouter(prefix="/documents", tags=["Documents"])

# Where files are stored on disk
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _check_project_access(project_id: int, scope: VisibleScope, session: Session):
    """Reuse the same visibility check as tasks and requirements."""
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


@router.post("/upload", response_model=DocumentRead)
async def upload_document(
    project_id: int = Form(...),
    title: str = Form(...),
    category: str = Form(None),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    _check_project_access(project_id, scope, session)

    # Generate a unique filename so files never collide on disk
    extension = os.path.splitext(file.filename)[1]
    stored_filename = f"{uuid.uuid4()}{extension}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)

    # Write file to disk
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        project_id=project_id,
        uploaded_by=current_user.id,
        title=title,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_size=len(content),
        mime_type=file.content_type,
        category=category,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.get("/project/{project_id}", response_model=List[DocumentRead])
def get_project_documents(
    project_id: int,
    session: Session = Depends(get_session),
    scope: VisibleScope = Depends(get_scope),
):
    _check_project_access(project_id, scope, session)
    docs = session.exec(select(Document).where(Document.project_id == project_id)).all()
    return docs


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    inline: bool = False,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _check_project_access(doc.project_id, scope, session)

    file_path = os.path.join(UPLOAD_DIR, doc.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    # inline=True means display in browser, False means force download
    disposition = "inline" if inline else "attachment"

    return FileResponse(
        path=file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{doc.original_filename}"'
        },
    )


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    session: Session = Depends(get_session),
    current_user: Employee = Depends(get_current_user),
    scope: VisibleScope = Depends(get_scope),
):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    _check_project_access(doc.project_id, scope, session)

    # Only uploader, team lead, manager, or admin can delete
    if current_user.id != doc.uploaded_by and current_user.role not in (
        "admin",
        "manager",
        "team_lead",
        "department_head",
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this document"
        )

    # Remove from disk
    file_path = os.path.join(UPLOAD_DIR, doc.stored_filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    session.delete(doc)
    session.commit()
    return {"message": "Document deleted"}
