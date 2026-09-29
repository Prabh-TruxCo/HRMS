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
    CompanySetupStatusResponse,
)
from app.services.company_service import (
    create_companies,
    get_user_companies,
    get_company_for_user,
    update_company,
    get_company_setup_status,
)
from app.schemas.organization import (
    OrganizationConfigurationResponse,
    OrganizationConfigurationUpdateRequest,
)
from app.services.organization_service import (
    get_organization_configuration,
    update_organization_configuration,
)
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
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
    "/{company_id}/setup-status",
    response_model=CompanySetupStatusResponse,
)
def get_setup_status(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_company_setup_status(
        db=db,
        user=current_user,
        company_id=company_id,
    )


@router.post(
    "/{company_id}/logo",
    response_model=CompanyDetailResponse,
)
def upload_company_logo(
    company_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = get_company_for_user(
            db=db,
            user_id=current_user.id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    allowed_types = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPG, WEBP, or SVG images are allowed.",
        )

    upload_dir = Path("uploads/companies")
    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    extension = allowed_types[file.content_type]
    filename = f"company_{company.id}_{uuid4().hex}{extension}"
    file_path = upload_dir / filename

    try:
        with file_path.open("wb") as buffer:
            buffer.write(file.file.read())

        company.logo = f"/uploads/companies/{filename}"

        db.commit()
        db.refresh(company)

        return company

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload company logo.",
        )


@router.get(
    "/{company_id}/organization",
    response_model=OrganizationConfigurationResponse,
)
def get_organization_configuration_endpoint(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        get_company_for_user(
            db=db,
            user_id=current_user.id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    configuration = get_organization_configuration(
        db=db,
        company_id=company_id,
    )

    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization configuration not found.",
        )

    return configuration


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
    "/{company_id}/organization",
    response_model=OrganizationConfigurationResponse,
)
def update_organization_configuration_endpoint(
    company_id: int,
    data: OrganizationConfigurationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        get_company_for_user(
            db=db,
            user_id=current_user.id,
            company_id=company_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    return update_organization_configuration(
        db=db,
        company_id=company_id,
        branches_enabled=data.branches_enabled,
        departments_enabled=data.departments_enabled,
        teams_enabled=data.teams_enabled,
        designations_enabled=data.designations_enabled,
        clients_enabled=data.clients_enabled,
        sites_enabled=data.sites_enabled,
        posts_enabled=data.posts_enabled,
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
