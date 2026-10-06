from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.companies import router as companies_router
from app.api.membership import router as membership_router
from app.api.workforce import router as workforce_router
from app.api.employment import router as employment_router
from app.api.roles import router as roles_router
from app.api.member_roles import router as member_roles_router
from app.api.permissions import router as permissions_router
from app.api.branches import router as branches_router
from app.api.departments import router as departments_router
from app.api.audit_logs import router as audit_logs_router
from app.api.teams import router as teams_router
from app.api.designations import router as designations_router
from app.api.clients import router as clients_router

from pathlib import Path

from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="HRMS API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    StaticFiles(directory=Path("uploads")),
    name="uploads",
)
app.include_router(auth_router, prefix="/api")
app.include_router(companies_router, prefix="/api")
app.include_router(membership_router, prefix="/api")
app.include_router(workforce_router, prefix="/api")
app.include_router(employment_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(member_roles_router, prefix="/api")
app.include_router(permissions_router, prefix="/api")
app.include_router(branches_router, prefix="/api")
app.include_router(departments_router, prefix="/api")
app.include_router(audit_logs_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(designations_router, prefix="/api")
app.include_router(clients_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "HRMS API is running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }
