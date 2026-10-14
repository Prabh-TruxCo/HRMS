from math import ceil

from fastapi import Query
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.api.organization_access import validate_organization_module_access
from app.schemas.site import (
    SiteCreateRequest,
    SiteListResponse,
    SiteResponse,
    SiteUpdateRequest,
)
from app.services.site_service import (
    create_site,
    get_site,
    list_sites,
    update_site,
)

router = APIRouter(
    prefix="/companies/{company_id}/sites",
    tags=["Sites"],
)


@router.get("", response_model=SiteListResponse)
def get_sites(
    company_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, max_length=150),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "sites_enabled",
    )

    sites, total = list_sites(
        db,
        company_id,
        page=page,
        page_size=page_size,
        search=search,
    )

    return {
        "sites": sites,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/{site_id}", response_model=SiteResponse)
def get_site_detail(
    company_id: int,
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "sites_enabled",
    )

    site = get_site(db, company_id, site_id)

    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )

    return site


@router.post(
    "",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_site_endpoint(
    company_id: int,
    payload: SiteCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "sites_enabled",
    )

    try:
        return create_site(
            db,
            company_id,
            user_id=current_user.id,
            **payload.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put("/{site_id}", response_model=SiteResponse)
def update_site_endpoint(
    company_id: int,
    site_id: int,
    payload: SiteUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_organization_module_access(
        db,
        company_id,
        current_user,
        "sites_enabled",
    )

    site = get_site(db, company_id, site_id)

    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )

    try:
        return update_site(
            db,
            site,
            user_id=current_user.id,
            **payload.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
