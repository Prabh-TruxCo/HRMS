from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.companies import router as companies_router
from app.api.membership import router as membership_router
from app.api.workforce import router as workforce_router
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
app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(membership_router)
app.include_router(workforce_router)


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
