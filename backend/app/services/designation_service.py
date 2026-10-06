from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.designation import Designation
from app.services.audit_log_service import AuditLogService


def _get_account_id(
    db: Session,
    company_id: int,
) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def list_designations(
    db: Session,
    company_id: int,
) -> list[Designation]:
    statement = (
        select(Designation)
        .where(Designation.company_id == company_id)
        .order_by(Designation.name.asc())
    )

    return list(db.scalars(statement).all())


def get_designation(
    db: Session,
    company_id: int,
    designation_id: int,
) -> Designation | None:
    statement = select(Designation).where(
        Designation.id == designation_id,
        Designation.company_id == company_id,
    )

    return db.scalar(statement)


def create_designation(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    is_active: bool = True,
) -> Designation:
    designation = Designation(
        company_id=company_id,
        name=name.strip(),
        code=code.strip() if code else None,
        description=description.strip() if description else None,
        is_active=is_active,
    )

    db.add(designation)

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
            entity_type="DESIGNATION",
            entity_id=designation.id,
            action="CREATED",
            description=f"Designation '{designation.name}' was created.",
            new_values={
                "name": designation.name,
                "code": designation.code,
                "description": designation.description,
                "is_active": designation.is_active,
            },
        )

        db.commit()
        db.refresh(designation)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A designation with this name already exists."
        )

    return designation


def update_designation(
    db: Session,
    designation: Designation,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
) -> Designation:
    old_values = {
        "name": designation.name,
        "code": designation.code,
        "description": designation.description,
        "is_active": designation.is_active,
    }

    designation.name = name.strip()
    designation.code = code.strip() if code else None
    designation.description = (
        description.strip()
        if description
        else None
    )

    new_values = {
        "name": designation.name,
        "code": designation.code,
        "description": designation.description,
        "is_active": designation.is_active,
    }

    try:
        db.flush()

        account_id = _get_account_id(
            db,
            designation.company_id,
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=designation.company_id,
            module="ORGANIZATION",
            entity_type="DESIGNATION",
            entity_id=designation.id,
            action="UPDATED",
            description=(
                f"Designation '{designation.name}' was updated."
            ),
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(designation)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A designation with this name already exists."
        )

    return designation


def update_designation_status(
    db: Session,
    designation: Designation,
    *,
    user_id: int,
    is_active: bool,
) -> Designation:
    old_is_active = designation.is_active

    if old_is_active == is_active:
        return designation

    designation.is_active = is_active

    action = "ENABLED" if is_active else "DISABLED"

    description = (
        f"Designation '{designation.name}' was enabled."
        if is_active
        else f"Designation '{designation.name}' was disabled."
    )

    try:
        db.flush()

        account_id = _get_account_id(
            db,
            designation.company_id,
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=designation.company_id,
            module="ORGANIZATION",
            entity_type="DESIGNATION",
            entity_id=designation.id,
            action=action,
            description=description,
            old_values={
                "is_active": old_is_active,
            },
            new_values={
                "is_active": is_active,
            },
        )

        db.commit()
        db.refresh(designation)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "Unable to update designation status."
        )

    return designation