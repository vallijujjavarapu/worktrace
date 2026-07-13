from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from scalar_fastapi import get_scalar_api_reference

# Routers
from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.department import router as department_router
from app.routers.team import router as team_router
from app.routers.project import router as project_router
from app.routers.task import router as task_router
from app.routers.client import router as client_router
from app.routers.requirement import router as requirement_router

# Model imports ensure create_db_and_tables() sees all tables
from app.models.project import Project, ProjectTeam
from app.models.task import Task, TaskAssignee, TaskActivityLog
from app.models.client import Client, ClientContact
from app.models.requirement import Requirement
from app.routers.work_update import router as work_update_router
from app.models.work_update import WorkUpdate
from app.routers.document import router as document_router
from app.models.document import Document
from app.routers.ai import router as ai_router

app = FastAPI(title="WorkTrace API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(department_router)
app.include_router(team_router)
app.include_router(project_router)
app.include_router(task_router)
app.include_router(client_router)
app.include_router(requirement_router)
app.include_router(work_update_router)
app.include_router(document_router)
app.include_router(ai_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def root():
    return {"message": "WorkTrace Backend Running"}


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(openapi_url=app.openapi_url, title="WorkTrace API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://*.vercel.app",  # allows all Vercel preview URLs
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
