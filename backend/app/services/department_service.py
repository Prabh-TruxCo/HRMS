from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.department import Department
from app.services.audit_log_service import AuditLogService


def _get_account_id(db: Session, company_id: int) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def list_departments(
    db: Session,
    company_id: int,
) -> list[Department]:
    statement = (
        select(Department)
        .where(Department.company_id == company_id)
        .order_by(Department.name.asc())
    )

    return list(db.scalars(statement).all())


def get_department(
    db: Session,
    company_id: int,
    department_id: int,
) -> Department | None:
    statement = select(Department).where(
        Department.id == department_id,
        Department.company_id == company_id,
    )

    return db.scalar(statement)


def create_department(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    name: str,
    code: str | None,
    description: str | None,
    is_active: bool,
) -> Department:
    department = Department(
        company_id=company_id,
        name=name.strip(),
        code=code.strip() if code else None,
        description=description.strip() if description else None,
        is_active=is_active,
    )

    db.add(department)

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
            entity_type="DEPARTMENT",
            entity_id=department.id,
            action="CREATED",
            description=f"Department '{department.name}' was created.",
            new_values={
                "name": department.name,
                "code": department.code,
                "description": department.description,
                "is_active": department.is_active,
            },
        )

        db.commit()
        db.refresh(department)

    except IntegrityError:
        db.rollback()
        raise ValueError("A department with this name already exists.")

    return department


def update_department(
    db: Session,
    department: Department,
    *,
    user_id: int,
    name: str,
    code: str | None,
    description: str | None,
    is_active: bool,
) -> Department:
    old_values = {
        "name": department.name,
        "code": department.code,
        "description": department.description,
        "is_active": department.is_active,
    }

    old_is_active = department.is_active

    department.name = name.strip()
    department.code = code.strip() if code else None
    department.description = description.strip() if description else None
    department.is_active = is_active

    new_values = {
        "name": department.name,
        "code": department.code,
        "description": department.description,
        "is_active": department.is_active,
    }

    if old_is_active != is_active:
        if is_active:
            action = "ENABLED"
            audit_description = f"Department '{department.name}' was enabled."
        else:
            action = "DISABLED"
            audit_description = f"Department '{department.name}' was disabled."
    else:
        action = "UPDATED"
        audit_description = f"Department '{department.name}' was updated."

    try:
        db.flush()

        account_id = _get_account_id(
            db,
            department.company_id,
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=department.company_id,
            module="ORGANIZATION",
            entity_type="DEPARTMENT",
            entity_id=department.id,
            action=action,
            description=audit_description,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(department)

    except IntegrityError:
        db.rollback()
        raise ValueError("A department with this name already exists.")

    return department
