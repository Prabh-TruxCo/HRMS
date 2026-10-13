
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.office_location import (
    OfficeLocationCreateRequest,
    OfficeLocationListResponse,
    OfficeLocationResponse,
    OfficeLocationUpdateRequest,
)
from app.services.office_location_service import (
    create_office_location,
    get_office_location,
    list_office_locations,
    update_office_location,
)

router = APIRouter(
    prefix="/companies/{company_id}/branches/{branch_id}/locations",
    tags=["Office Locations"],
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


def get_location_or_404(
    db: Session,
    company_id: int,
    branch_id: int,
    location_id: int,
):
    location = get_office_location(
        db,
        company_id,
        location_id,
    )

    if not location or location.branch_id != branch_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Office location not found.",
        )

    return location


@router.get(
    "",
    response_model=OfficeLocationListResponse,
)
def get_office_locations(
    company_id: int,
    branch_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(db, company_id, current_user)

    return list_office_locations(
        db,
        company_id,
        branch_id=branch_id,
        page=page,
        page_size=page_size,
        search=search,
    )


@router.get(
    "/{location_id}",
    response_model=OfficeLocationResponse,
)
def get_office_location_detail(
    company_id: int,
    branch_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(db, company_id, current_user)

    return get_location_or_404(
        db,
        company_id,
        branch_id,
        location_id,
    )


@router.post(
    "",
    response_model=OfficeLocationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_office_location_endpoint(
    company_id: int,
    branch_id: int,
    payload: OfficeLocationCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(db, company_id, current_user)

    try:
        return create_office_location(
            db,
            company_id,
            branch_id,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            latitude=payload.latitude,
            longitude=payload.longitude,
            geofence_enabled=payload.geofence_enabled,
            geofence_radius_meters=payload.geofence_radius_meters,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{location_id}",
    response_model=OfficeLocationResponse,
)
def update_office_location_endpoint(
    company_id: int,
    branch_id: int,
    location_id: int,
    payload: OfficeLocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(db, company_id, current_user)

    location = get_location_or_404(
        db,
        company_id,
        branch_id,
        location_id,
    )

    try:
        return update_office_location(
            db,
            location,
            user_id=current_user.id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            latitude=payload.latitude,
            longitude=payload.longitude,
            geofence_enabled=payload.geofence_enabled,
            geofence_radius_meters=payload.geofence_radius_meters,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
