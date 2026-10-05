from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.department import Department


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
    name: str,
    code: str | None,
    description: str | None,
    is_active: bool,
) -> Department:
    department = Department(
        company_id=company_id,
        name=name,
        code=code,
        description=description,
        is_active=is_active,
    )

    db.add(department)

    try:
        db.commit()
        db.refresh(department)
    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A department with this name already exists."
        )

    return department


def update_department(
    db: Session,
    department: Department,
    name: str,
    code: str | None,
    description: str | None,
    is_active: bool,
) -> Department:
    department.name = name
    department.code = code
    department.description = description
    department.is_active = is_active

    try:
        db.commit()
        db.refresh(department)
    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A department with this name already exists."
        )

    return department


def delete_department(
    db: Session,
    department: Department,
) -> None:
    db.delete(department)
    db.commit()