from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.company import (
    CompanyBulkCreateRequest,
    CompanyBulkCreateResponse,
    CompanyListItem,
    MyCompaniesResponse,
    CompanyDetailResponse,
    CompanyUpdateRequest,
)
from app.services.company_service import (
    create_companies,
    get_user_companies,
    get_company_for_user,
    update_company,
)

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post(
    "/bulk",
    response_model=CompanyBulkCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_companies_endpoint(
    data: CompanyBulkCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        companies = create_companies(
            db=db,
            current_user=current_user,
            companies_data=data.companies,
        )

        return {
            "companies": companies,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get(
    "/mine",
    response_model=MyCompaniesResponse,
)
def get_my_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    companies = get_user_companies(
        db=db,
        current_user=current_user,
    )

    return {
        "companies": companies,
    }


@router.get(
    "/{company_id}",
    response_model=CompanyDetailResponse,
)
def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_company_for_user(
            db=db,
            user_id=current_user.id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )


@router.put(
    "/{company_id}",
    response_model=CompanyDetailResponse,
)
def update_company_endpoint(
    company_id: int,
    data: CompanyUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return update_company(
            db=db,
            user_id=current_user.id,
            company_id=company_id,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
