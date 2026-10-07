from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)

from pathlib import Path
from uuid import uuid4
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, RegisterResponse, LoginRequest
from app.services.auth_service import register_customer, login_user

from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    response: Response,
    first_name: str = Form(...),
    last_name: str | None = Form(None),
    email: str = Form(...),
    password: str = Form(...),
    account_name: str = Form(...),
    company_name: str = Form(...),
    company_code: str = Form(...),
    industry_codes: list[str] = Form(...),
    employee_size: str | None = Form(None),
    country: str = Form("India"),
    color: str | None = Form(None),
    logo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    try:
        logo_path = None

        if logo:
            allowed_types = {
                "image/png": "png",
                "image/jpeg": "jpg",
                "image/webp": "webp",
                "image/svg+xml": "svg",
            }

            extension = allowed_types.get(logo.content_type)

            if not extension:
                raise ValueError(
                    "Unsupported logo format. " "Please upload PNG, JPG, WEBP, or SVG."
                )

            logo_content = logo.file.read()

            if len(logo_content) > 2 * 1024 * 1024:
                raise ValueError("Company logo must be smaller than 2 MB.")

            upload_dir = Path("uploads/companies")
            upload_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            filename = f"company_registration_" f"{uuid4().hex}.{extension}"

            logo_path = f"/uploads/companies/{filename}"

            file_path = upload_dir / filename
            file_path.write_bytes(logo_content)

        data = RegisterRequest(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            account_name=account_name,
            company_name=company_name,
            company_code=company_code,
            industry_codes=industry_codes,
            employee_size=employee_size,
            country=country,
            color=color,
            logo=logo_path,
        )

        result = register_customer(
            db,
            data,
        )

        response.set_cookie(
            key="session_token",
            value=result["access_token"],
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24,
            path="/",
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create account.",
        )


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_platform_admin": current_user.is_platform_admin,
    }


@router.post("/login")
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        result = login_user(
            db=db,
            email=data.email,
            password=data.password,
        )

        response.set_cookie(
            key="session_token",
            value=result["access_token"],
            httponly=True,
            secure=False,  # True in production with HTTPS
            samesite="lax",
            max_age=60 * 60 * 24,
            path="/",
        )

        return {
            "message": "Login successful.",
            "user": {
                "id": result["user"].id,
                "email": result["user"].email,
                "first_name": result["user"].first_name,
                "last_name": result["user"].last_name,
                "is_platform_admin": result["user"].is_platform_admin,
            },
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session_token",
        path="/",
    )

    return {
        "message": "Logout successful.",
    }
