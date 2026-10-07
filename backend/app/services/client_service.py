from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.company import Company
from app.services.audit_log_service import AuditLogService


def _get_account_id(
    db: Session,
    company_id: int,
) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def list_clients(
    db: Session,
    company_id: int,
) -> list[Client]:
    return (
        db.query(Client)
        .filter(
            Client.company_id == company_id,
        )
        .order_by(Client.name.asc())
        .all()
    )


def get_client(
    db: Session,
    company_id: int,
    client_id: int,
) -> Client | None:
    return (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.company_id == company_id,
        )
        .first()
    )


def create_client(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    contact_person: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    description: str | None = None,
    is_active: bool = True,
) -> Client:
    client = Client(
        company_id=company_id,
        name=name.strip(),
        code=code.strip() if code else None,
        contact_person=contact_person.strip() if contact_person else None,
        phone=phone.strip() if phone else None,
        email=email.strip() if email else None,
        address=address.strip() if address else None,
        city=city.strip() if city else None,
        state=state.strip() if state else None,
        country=country.strip(),
        description=description.strip() if description else None,
        is_active=is_active,
    )

    db.add(client)

    try:
        db.flush()

        account_id = _get_account_id(
            db,
            company_id,
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module="ORGANIZATION",
            entity_type="CLIENT",
            entity_id=client.id,
            action="CREATED",
            description=f"Client '{client.name}' was created.",
            new_values={
                "name": client.name,
                "code": client.code,
                "contact_person": client.contact_person,
                "phone": client.phone,
                "email": client.email,
                "address": client.address,
                "city": client.city,
                "state": client.state,
                "country": client.country,
                "description": client.description,
                "is_active": client.is_active,
            },
        )

        db.commit()
        db.refresh(client)

    except IntegrityError:
        db.rollback()
        raise ValueError("A client with this name already exists.")

    return client


def update_client(
    db: Session,
    client: Client,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    contact_person: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    description: str | None = None,
) -> Client:
    old_values = {
        "name": client.name,
        "code": client.code,
        "contact_person": client.contact_person,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
        "city": client.city,
        "state": client.state,
        "country": client.country,
        "description": client.description,
    }

    client.name = name.strip()
    client.code = code.strip() if code else None
    client.contact_person = contact_person.strip() if contact_person else None
    client.phone = phone.strip() if phone else None
    client.email = email.strip() if email else None
    client.address = address.strip() if address else None
    client.city = city.strip() if city else None
    client.state = state.strip() if state else None
    client.country = country.strip()
    client.description = description.strip() if description else None

    new_values = {
        "name": client.name,
        "code": client.code,
        "contact_person": client.contact_person,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
        "city": client.city,
        "state": client.state,
        "country": client.country,
        "description": client.description,
    }

    has_changes = old_values != new_values

    try:
        db.flush()

        if has_changes:
            account_id = _get_account_id(
                db,
                client.company_id,
            )

            AuditLogService(db).log(
                user_id=user_id,
                account_id=account_id,
                company_id=client.company_id,
                module="ORGANIZATION",
                entity_type="CLIENT",
                entity_id=client.id,
                action="UPDATED",
                description=f"Client '{client.name}' was updated.",
                old_values=old_values,
                new_values=new_values,
            )

        db.commit()
        db.refresh(client)

    except IntegrityError:
        db.rollback()
        raise ValueError("A client with this name already exists.")

    return client


def update_client_status(
    db: Session,
    client: Client,
    *,
    user_id: int,
    is_active: bool,
) -> Client:
    if client.is_active == is_active:
        return client

    old_values = {
        "is_active": client.is_active,
    }

    client.is_active = is_active

    new_values = {
        "is_active": client.is_active,
    }

    if is_active:
        action = "ENABLED"
        description = f"Client '{client.name}' was enabled."
    else:
        action = "DISABLED"
        description = f"Client '{client.name}' was disabled."

    db.flush()

    account_id = _get_account_id(
        db,
        client.company_id,
    )

    AuditLogService(db).log(
        user_id=user_id,
        account_id=account_id,
        company_id=client.company_id,
        module="ORGANIZATION",
        entity_type="CLIENT",
        entity_id=client.id,
        action=action,
        description=description,
        old_values=old_values,
        new_values=new_values,
    )

    db.commit()
    db.refresh(client)

    return client
