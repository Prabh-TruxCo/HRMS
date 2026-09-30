from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import (
    RoleCreateRequest,
    RoleDetailResponse,
    RoleListResponse,
)
from app.services.role_service import (
    create_role,
    get_company_roles,
    get_role_by_id,
    get_role_permissions,
    is_system_role,
)
from app.services.company_service import get_company_for_user

router = APIRouter(
    prefix="/companies/{company_id}/roles",
    tags=["Roles & Permissions"],
)


@router.get(
    "",
    response_model=RoleListResponse,
)
def list_roles(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validates that the user belongs to this company.
    get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    roles = get_company_roles(
        db=db,
        company_id=company_id,
    )

    return {
        "roles": roles,
    }


@router.get(
    "/{role_id}",
    response_model=RoleDetailResponse,
)
def get_role(
    company_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validates that the user belongs to this company.
    get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    role = get_role_by_id(
        db=db,
        company_id=company_id,
        role_id=role_id,
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found.",
        )

    permissions = get_role_permissions(
        db=db,
        role_id=role.id,
    )

    return {
        "id": role.id,
        "company_id": role.company_id,
        "name": role.name,
        "description": role.description,
        "is_active": role.is_active,
        "is_system_role": is_system_role(role.name),
        "permissions": permissions,
    }


@router.post(
    "",
    response_model=RoleDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company_role(
    company_id: int,
    payload: RoleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    try:
        role = create_role(
            db=db,
            company_id=company_id,
            name=payload.name,
            description=payload.description,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    return {
        "id": role.id,
        "company_id": role.company_id,
        "name": role.name,
        "description": role.description,
        "is_active": role.is_active,
        "is_system_role": False,
        "permissions": [],
    }
