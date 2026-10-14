from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.branch import (
    BranchCreateRequest,
    BranchListResponse,
    BranchResponse,
    BranchUpdateRequest,
)
from app.services.branch_service import (
    create_branch,
    get_branch,
    list_branches,
    update_branch,
)
from app.api.organization_access import validate_organization_module_access

router = APIRouter(
    prefix="/companies/{company_id}/branches",
    tags=["Branches"],
)


@router.get(
    "",
    response_model=BranchListResponse,
)
def get_branches(
    company_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "branches_enabled",
    )

    return list_branches(
        db,
        company_id,
        page=page,
        page_size=page_size,
        search=search,
    )


@router.get(
    "/{branch_id}",
    response_model=BranchResponse,
)
def get_branch_detail(
    company_id: int,
    branch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "branches_enabled",
    )

    branch = get_branch(
        db,
        company_id,
        branch_id,
    )

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found.",
        )

    return branch


@router.post(
    "",
    response_model=BranchResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_branch_endpoint(
    company_id: int,
    payload: BranchCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "branches_enabled",
    )

    try:
        return create_branch(
            db,
            company_id,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{branch_id}",
    response_model=BranchResponse,
)
def update_branch_endpoint(
    company_id: int,
    branch_id: int,
    payload: BranchUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "branches_enabled",
    )

    branch = get_branch(
        db,
        company_id,
        branch_id,
    )

    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found.",
        )

    try:
        return update_branch(
            db,
            branch,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
