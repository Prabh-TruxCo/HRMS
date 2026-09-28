from fastapi import APIRouter, Depends, HTTPException, Response, status
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
    data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        result = register_customer(db, data)

        response.set_cookie(
            key="session_token",
            value=result["access_token"],
            httponly=True,
            secure=False,  # True in production with HTTPS
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
