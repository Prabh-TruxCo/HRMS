from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.branch import (
    BranchCreateRequest,
    BranchListResponse,
    BranchResponse,
    BranchUpdateRequest,
)
from app.services.branch_service import (
    create_branch,
    delete_branch,
    get_branch,
    list_branches,
    update_branch,
)

router = APIRouter(
    prefix="/companies/{company_id}/branches",
    tags=["Branches"],
)


def validate_company_membership(
    db: Session,
    company_id: int,
    current_user,
) -> None:
    membership = (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.is_active.is_(True),
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company.",
        )


@router.get(
    "",
    response_model=BranchListResponse,
)
def get_branches(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    return {
        "branches": list_branches(
            db,
            company_id,
        )
    }


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
    validate_company_membership(
        db,
        company_id,
        current_user,
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
    validate_company_membership(
        db,
        company_id,
        current_user,
    )

    try:
        return create_branch(
            db,
            company_id,
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
    validate_company_membership(
        db,
        company_id,
        current_user,
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


@router.delete(
    "/{branch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_branch_endpoint(
    company_id: int,
    branch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user,
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

    delete_branch(
        db,
        branch,
    )

    return None
