
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.company import Company
from app.models.site import Site
from app.services.audit_log_service import AuditLogService


def _get_account_id(db: Session, company_id: int) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def _validate_client(
    db: Session,
    company_id: int,
    client_id: int,
) -> Client:
    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.company_id == company_id,
        )
        .first()
    )

    if client is None:
        raise ValueError(
            "The selected client does not belong to this company."
        )

    if not client.is_active:
        raise ValueError("The selected client is inactive.")

    return client


def list_sites(db: Session, company_id: int) -> list[Site]:
    return (
        db.query(Site)
        .filter(Site.company_id == company_id)
        .order_by(Site.name.asc())
        .all()
    )


def get_site(
    db: Session,
    company_id: int,
    site_id: int,
) -> Site | None:
    return (
        db.query(Site)
        .filter(
            Site.id == site_id,
            Site.company_id == company_id,
        )
        .first()
    )


def create_site(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    client_id: int,
    name: str,
    code: str | None = None,
    site_type: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    postal_code: str | None = None,
    contact_person: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    is_active: bool = True,
) -> Site:
    _validate_client(db, company_id, client_id)

    site = Site(
        company_id=company_id,
        client_id=client_id,
        name=name.strip(),
        code=code.strip() if code else None,
        site_type=site_type.strip() if site_type else None,
        description=description.strip() if description else None,
        address=address.strip() if address else None,
        city=city.strip() if city else None,
        state=state.strip() if state else None,
        country=country.strip(),
        postal_code=postal_code.strip() if postal_code else None,
        contact_person=(
            contact_person.strip() if contact_person else None
        ),
        phone=phone.strip() if phone else None,
        email=email.strip() if email else None,
        is_active=is_active,
    )

    db.add(site)

    try:
        db.flush()

        account_id = _get_account_id(db, company_id)

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="SITE",
            entity_id=site.id,
            action="CREATED",
            description=f"Site '{site.name}' was created.",
            new_values={
                "client_id": site.client_id,
                "name": site.name,
                "code": site.code,
                "site_type": site.site_type,
                "description": site.description,
                "address": site.address,
                "city": site.city,
                "state": site.state,
                "country": site.country,
                "postal_code": site.postal_code,
                "contact_person": site.contact_person,
                "phone": site.phone,
                "email": site.email,
                "is_active": site.is_active,
            },
        )

        db.commit()
        db.refresh(site)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A site with this name already exists in this company."
        ) from exc
    except Exception:
        db.rollback()
        raise

    return site


def update_site(
    db: Session,
    site: Site,
    *,
    user_id: int,
    client_id: int,
    name: str,
    code: str | None = None,
    site_type: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    postal_code: str | None = None,
    contact_person: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    is_active: bool,
) -> Site:
    _validate_client(db, site.company_id, client_id)

    old_values = {
        "client_id": site.client_id,
        "name": site.name,
        "code": site.code,
        "site_type": site.site_type,
        "description": site.description,
        "address": site.address,
        "city": site.city,
        "state": site.state,
        "country": site.country,
        "postal_code": site.postal_code,
        "contact_person": site.contact_person,
        "phone": site.phone,
        "email": site.email,
        "is_active": site.is_active,
    }

    old_is_active = site.is_active

    site.client_id = client_id
    site.name = name.strip()
    site.code = code.strip() if code else None
    site.site_type = site_type.strip() if site_type else None
    site.description = description.strip() if description else None
    site.address = address.strip() if address else None
    site.city = city.strip() if city else None
    site.state = state.strip() if state else None
    site.country = country.strip()
    site.postal_code = postal_code.strip() if postal_code else None
    site.contact_person = (
        contact_person.strip() if contact_person else None
    )
    site.phone = phone.strip() if phone else None
    site.email = email.strip() if email else None
    site.is_active = is_active

    new_values = {
        "client_id": site.client_id,
        "name": site.name,
        "code": site.code,
        "site_type": site.site_type,
        "description": site.description,
        "address": site.address,
        "city": site.city,
        "state": site.state,
        "country": site.country,
        "postal_code": site.postal_code,
        "contact_person": site.contact_person,
        "phone": site.phone,
        "email": site.email,
        "is_active": site.is_active,
    }

    if old_is_active != is_active:
        action = "ENABLED" if is_active else "DISABLED"
        description_text = (
            f"Site '{site.name}' was enabled."
            if is_active
            else f"Site '{site.name}' was disabled."
        )
    else:
        action = "UPDATED"
        description_text = f"Site '{site.name}' was updated."

    try:
        db.flush()

        account_id = _get_account_id(db, site.company_id)

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=site.company_id,
            module="ORGANIZATION",
            entity_type="SITE",
            entity_id=site.id,
            action=action,
            description=description_text,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(site)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A site with this name already exists in this company."
        ) from exc
    except Exception:
        db.rollback()
        raise

    return site