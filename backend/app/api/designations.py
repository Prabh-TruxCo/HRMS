from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.designation import (
    DesignationCreate,
    DesignationResponse,
    DesignationUpdate,
)
from app.services.designation_service import (
    create_designation,
    get_designation,
    list_designations,
    update_designation,
    update_designation_status,
)

router = APIRouter(
    prefix="/companies/{company_id}/designations",
    tags=["Designations"],
)


def validate_company_membership(
    db: Session,
    user_id: int,
    company_id: int,
) -> None:
    membership = (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.user_id == user_id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.is_active.is_(True),
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company.",
        )


@router.get(
    "",
    response_model=list[DesignationResponse],
)
def get_designations(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    return list_designations(
        db,
        company_id,
    )


@router.get(
    "/{designation_id}",
    response_model=DesignationResponse,
)
def get_designation_by_id(
    company_id: int,
    designation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    designation = get_designation(
        db,
        company_id,
        designation_id,
    )

    if designation is None:
        raise HTTPException(
            status_code=404,
            detail="Designation not found.",
        )

    return designation


@router.post(
    "",
    response_model=DesignationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_designation_api(
    company_id: int,
    payload: DesignationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    try:
        return create_designation(
            db,
            company_id,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.put(
    "/{designation_id}",
    response_model=DesignationResponse,
)
def update_designation_api(
    company_id: int,
    designation_id: int,
    payload: DesignationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    designation = get_designation(
        db,
        company_id,
        designation_id,
    )

    if designation is None:
        raise HTTPException(
            status_code=404,
            detail="Designation not found.",
        )

    try:
        return update_designation(
            db,
            designation,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.patch(
    "/{designation_id}/status",
    response_model=DesignationResponse,
)
def update_designation_status_api(
    company_id: int,
    designation_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    designation = get_designation(
        db,
        company_id,
        designation_id,
    )

    if designation is None:
        raise HTTPException(
            status_code=404,
            detail="Designation not found.",
        )

    try:
        return update_designation_status(
            db,
            designation,
            user_id=current_user.id,
            is_active=is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )