
from math import ceil

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.company import Company
from app.models.office_location import OfficeLocation
from app.models.workforce_configuration import WorkforceConfiguration
from app.services.audit_log_service import AuditLogService


def _get_account_id(db: Session, company_id: int) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def _get_branch(
    db: Session,
    company_id: int,
    branch_id: int,
) -> Branch:
    branch = (
        db.query(Branch)
        .filter(
            Branch.id == branch_id,
            Branch.company_id == company_id,
        )
        .first()
    )

    if branch is None:
        raise ValueError("Branch not found for this company.")

    if not branch.is_active:
        raise ValueError("Cannot manage locations under an inactive branch.")

    return branch


def _validate_geofencing(
    db: Session,
    company_id: int,
    geofence_enabled: bool,
) -> None:
    if not geofence_enabled:
        return

    configuration = (
        db.query(WorkforceConfiguration)
        .filter(
            WorkforceConfiguration.company_id == company_id,
        )
        .first()
    )

    if configuration is None or not configuration.geofencing_enabled:
        raise ValueError(
            "Geofencing is not enabled in this company's Workforce Configuration."
        )


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    return cleaned or None


def _validate_name(name: str) -> str:
    cleaned = name.strip()

    if not cleaned:
        raise ValueError("Office location name cannot be empty.")

    return cleaned


def _location_values(location: OfficeLocation) -> dict:
    return {
        "branch_id": location.branch_id,
        "name": location.name,
        "code": location.code,
        "description": location.description,
        "address": location.address,
        "city": location.city,
        "state": location.state,
        "country": location.country,
        "postal_code": location.postal_code,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "geofence_enabled": location.geofence_enabled,
        "geofence_radius_meters": location.geofence_radius_meters,
        "is_active": location.is_active,
    }


def list_office_locations(
    db: Session,
    company_id: int,
    *,
    branch_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> dict:
    query = db.query(OfficeLocation).filter(
        OfficeLocation.company_id == company_id,
    )

    if branch_id is not None:
        query = query.filter(
            OfficeLocation.branch_id == branch_id,
        )

    search_term = search.strip() if search else ""

    if search_term:
        pattern = f"%{search_term}%"

        query = query.filter(
            or_(
                OfficeLocation.name.ilike(pattern),
                OfficeLocation.code.ilike(pattern),
                OfficeLocation.description.ilike(pattern),
                OfficeLocation.address.ilike(pattern),
                OfficeLocation.city.ilike(pattern),
                OfficeLocation.state.ilike(pattern),
                OfficeLocation.country.ilike(pattern),
                OfficeLocation.postal_code.ilike(pattern),
            )
        )

    total = query.with_entities(
        func.count(OfficeLocation.id)
    ).scalar() or 0

    locations = (
        query.order_by(
            OfficeLocation.name.asc(),
            OfficeLocation.id.asc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "locations": locations,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def get_office_location(
    db: Session,
    company_id: int,
    location_id: int,
) -> OfficeLocation | None:
    return (
        db.query(OfficeLocation)
        .filter(
            OfficeLocation.id == location_id,
            OfficeLocation.company_id == company_id,
        )
        .first()
    )


def create_office_location(
    db: Session,
    company_id: int,
    branch_id: int,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    postal_code: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    geofence_enabled: bool = False,
    geofence_radius_meters: int | None = None,
    is_active: bool = True,
) -> OfficeLocation:
    _get_branch(db, company_id, branch_id)
    _validate_geofencing(db, company_id, geofence_enabled)

    location = OfficeLocation(
        company_id=company_id,
        branch_id=branch_id,
        name=_validate_name(name),
        code=_clean_optional(code),
        description=_clean_optional(description),
        address=_clean_optional(address),
        city=_clean_optional(city),
        state=_clean_optional(state),
        country=country.strip(),
        postal_code=_clean_optional(postal_code),
        latitude=latitude,
        longitude=longitude,
        geofence_enabled=geofence_enabled,
        geofence_radius_meters=geofence_radius_meters,
        is_active=is_active,
    )

    db.add(location)

    try:
        db.flush()

        account_id = _get_account_id(db, company_id)

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="OFFICE_LOCATION",
            entity_id=location.id,
            action="CREATED",
            description=f"Office location '{location.name}' was created.",
            new_values=_location_values(location),
        )

        db.commit()
        db.refresh(location)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "An office location with this name already exists in this branch."
        ) from exc

    return location


def update_office_location(
    db: Session,
    location: OfficeLocation,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    postal_code: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    geofence_enabled: bool = False,
    geofence_radius_meters: int | None = None,
    is_active: bool,
) -> OfficeLocation:
    _get_branch(db, location.company_id, location.branch_id)
    _validate_geofencing(
        db,
        location.company_id,
        geofence_enabled,
    )

    old_values = _location_values(location)
    old_is_active = location.is_active

    location.name = _validate_name(name)
    location.code = _clean_optional(code)
    location.description = _clean_optional(description)
    location.address = _clean_optional(address)
    location.city = _clean_optional(city)
    location.state = _clean_optional(state)
    location.country = country.strip()
    location.postal_code = _clean_optional(postal_code)
    location.latitude = latitude
    location.longitude = longitude
    location.geofence_enabled = geofence_enabled
    location.geofence_radius_meters = geofence_radius_meters
    location.is_active = is_active

    new_values = _location_values(location)

    if old_is_active != is_active:
        action = "ENABLED" if is_active else "DISABLED"
        description_text = (
            f"Office location '{location.name}' was "
            f"{'enabled' if is_active else 'disabled'}."
        )
    else:
        action = "UPDATED"
        description_text = (
            f"Office location '{location.name}' was updated."
        )

    try:
        db.flush()

        account_id = _get_account_id(db, location.company_id)

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=location.company_id,
            module="ORGANIZATION",
            entity_type="OFFICE_LOCATION",
            entity_id=location.id,
            action=action,
            description=description_text,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(location)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "An office location with this name already exists in this branch."
        ) from exc

    return location
