from sqlalchemy.orm import Session

from app.models.employment_type import EmploymentType


def get_employment_types(
    db: Session,
    company_id: int,
) -> list[EmploymentType]:
    return (
        db.query(EmploymentType)
        .filter(EmploymentType.company_id == company_id)
        .order_by(EmploymentType.name.asc())
        .all()
    )


def get_employment_type(
    db: Session,
    company_id: int,
    employment_type_id: int,
) -> EmploymentType | None:
    return (
        db.query(EmploymentType)
        .filter(
            EmploymentType.id == employment_type_id,
            EmploymentType.company_id == company_id,
        )
        .first()
    )


def create_employment_type(
    db: Session,
    company_id: int,
    name: str,
    description: str | None,
) -> EmploymentType:
    employment_type = EmploymentType(
        company_id=company_id,
        name=name.strip(),
        description=description.strip() if description else None,
        is_active=True,
    )

    db.add(employment_type)
    db.commit()
    db.refresh(employment_type)

    return employment_type


def update_employment_type(
    db: Session,
    company_id: int,
    employment_type_id: int,
    name: str,
    description: str | None,
    is_active: bool,
) -> EmploymentType | None:
    employment_type = get_employment_type(
        db,
        company_id,
        employment_type_id,
    )

    if not employment_type:
        return None

    employment_type.name = name.strip()
    employment_type.description = (
        description.strip() if description else None
    )
    employment_type.is_active = is_active

    db.commit()
    db.refresh(employment_type)

    return employment_type


def delete_employment_type(
    db: Session,
    company_id: int,
    employment_type_id: int,
) -> bool:
    employment_type = get_employment_type(
        db,
        company_id,
        employment_type_id,
    )

    if not employment_type:
        return False

    db.delete(employment_type)
    db.commit()

    return True