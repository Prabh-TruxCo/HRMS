from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.department import (
    DepartmentCreateRequest,
    DepartmentListResponse,
    DepartmentResponse,
    DepartmentUpdateRequest,
)
from app.services.department_service import (
    create_department,
    get_department,
    list_departments,
    update_department,
)

router = APIRouter(
    prefix="/companies/{company_id}/departments",
    tags=["Departments"],
)


def validate_company_membership(
    db: Session,
    company_id: int,
    user_id: int,
) -> None:
    membership = db.scalar(
        CompanyMembership.__table__.select().where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == user_id,
            CompanyMembership.is_active.is_(True),
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company.",
        )


@router.get(
    "",
    response_model=DepartmentListResponse,
)
def get_departments(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user.id,
    )

    departments = list_departments(
        db,
        company_id,
    )

    return DepartmentListResponse(
        departments=departments,
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department_by_id(
    company_id: int,
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user.id,
    )

    department = get_department(
        db,
        company_id,
        department_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return department


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_department(
    company_id: int,
    payload: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user.id,
    )

    try:
        return create_department(
            db=db,
            company_id=company_id,
            user_id=current_user.id,
            name=payload.name.strip(),
            code=payload.code.strip() if payload.code else None,
            description=(payload.description.strip() if payload.description else None),
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update_existing_department(
    company_id: int,
    department_id: int,
    payload: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        company_id,
        current_user.id,
    )

    department = get_department(
        db,
        company_id,
        department_id,
    )

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    try:
        return update_department(
            db=db,
            department=department,
            user_id=current_user.id,
            name=payload.name.strip(),
            code=payload.code.strip() if payload.code else None,
            description=(payload.description.strip() if payload.description else None),
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
