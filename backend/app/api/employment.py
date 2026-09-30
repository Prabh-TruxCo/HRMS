from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.employment import (
    EmploymentTypeCreateRequest,
    EmploymentTypeResponse,
    EmploymentTypeUpdateRequest,
)
from app.services.company_service import get_company_for_user
from app.services.employment_service import (
    create_employment_type,
    delete_employment_type,
    get_employment_type,
    get_employment_types,
    update_employment_type,
)
from app.models.employment_type import EmploymentType

router = APIRouter(
    prefix="/companies/{company_id}/employment-types",
    tags=["Employment Types"],
)


@router.get(
    "",
    response_model=list[EmploymentTypeResponse],
)
def list_employment_types(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db,
        current_user.id,
        company_id,
    )

    return get_employment_types(
        db,
        company_id,
    )


@router.post(
    "",
    response_model=EmploymentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employment_type_api(
    company_id: int,
    data: EmploymentTypeCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db,
        current_user,
        company_id,
    )

    existing = (
        db.query(EmploymentType)
        .filter(
            EmploymentType.company_id == company_id,
            EmploymentType.name == data.name.strip(),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employment type with this name already exists.",
        )

    return create_employment_type(
        db=db,
        company_id=company_id,
        name=data.name,
        description=data.description,
    )


@router.put(
    "/{employment_type_id}",
    response_model=EmploymentTypeResponse,
)
def update_employment_type_api(
    company_id: int,
    employment_type_id: int,
    data: EmploymentTypeUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db,
        current_user,
        company_id,
    )

    existing = get_employment_type(
        db,
        company_id,
        employment_type_id,
    )

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employment type not found.",
        )

    duplicate = (
        db.query(EmploymentType)
        .filter(
            EmploymentType.company_id == company_id,
            EmploymentType.name == data.name.strip(),
            EmploymentType.id != employment_type_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An employment type with this name already exists.",
        )

    return update_employment_type(
        db=db,
        company_id=company_id,
        employment_type_id=employment_type_id,
        name=data.name,
        description=data.description,
        is_active=data.is_active,
    )


@router.delete(
    "/{employment_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_employment_type_api(
    company_id: int,
    employment_type_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db,
        current_user,
        company_id,
    )

    deleted = delete_employment_type(
        db,
        company_id,
        employment_type_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employment type not found.",
        )
