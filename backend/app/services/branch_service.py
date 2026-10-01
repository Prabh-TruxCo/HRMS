from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.branch import Branch


def list_branches(
    db: Session,
    company_id: int,
) -> list[Branch]:
    return (
        db.query(Branch)
        .filter(
            Branch.company_id == company_id,
        )
        .order_by(Branch.name.asc())
        .all()
    )


def get_branch(
    db: Session,
    company_id: int,
    branch_id: int,
) -> Branch | None:
    return (
        db.query(Branch)
        .filter(
            Branch.id == branch_id,
            Branch.company_id == company_id,
        )
        .first()
    )


def create_branch(
    db: Session,
    company_id: int,
    *,
    name: str,
    code: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    is_active: bool = True,
) -> Branch:
    branch = Branch(
        company_id=company_id,
        name=name.strip(),
        code=code.strip() if code else None,
        description=description.strip()
        if description
        else None,
        address=address.strip() if address else None,
        city=city.strip() if city else None,
        state=state.strip() if state else None,
        country=country.strip(),
        is_active=is_active,
    )

    db.add(branch)

    try:
        db.commit()
        db.refresh(branch)
    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A branch with this name already exists."
        )

    return branch


def update_branch(
    db: Session,
    branch: Branch,
    *,
    name: str,
    code: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    is_active: bool,
) -> Branch:
    branch.name = name.strip()
    branch.code = code.strip() if code else None
    branch.description = (
        description.strip()
        if description
        else None
    )
    branch.address = (
        address.strip()
        if address
        else None
    )
    branch.city = city.strip() if city else None
    branch.state = state.strip() if state else None
    branch.country = country.strip()
    branch.is_active = is_active

    try:
        db.commit()
        db.refresh(branch)
    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A branch with this name already exists."
        )

    return branch


def delete_branch(
    db: Session,
    branch: Branch,
) -> None:
    db.delete(branch)
    db.commit()