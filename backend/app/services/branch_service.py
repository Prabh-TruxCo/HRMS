from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.company import Company
from app.services.audit_log_service import AuditLogService
from sqlalchemy import func, or_


def _get_account_id(
    db: Session,
    company_id: int,
) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def list_branches(
    db: Session,
    company_id: int,
    *,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> dict:
    query = db.query(Branch).filter(
        Branch.company_id == company_id,
    )

    search_term = search.strip() if search else ""

    if search_term:
        pattern = f"%{search_term}%"

        query = query.filter(
            or_(
                Branch.name.ilike(pattern),
                Branch.code.ilike(pattern),
                Branch.description.ilike(pattern),
                Branch.address.ilike(pattern),
                Branch.city.ilike(pattern),
                Branch.state.ilike(pattern),
                Branch.country.ilike(pattern),
            )
        )

    total = query.with_entities(func.count(Branch.id)).scalar() or 0

    branches = (
        query.order_by(Branch.name.asc(), Branch.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size

    return {
        "branches": branches,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


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
    user_id: int,
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
        description=description.strip() if description else None,
        address=address.strip() if address else None,
        city=city.strip() if city else None,
        state=state.strip() if state else None,
        country=country.strip(),
        is_active=is_active,
    )

    db.add(branch)

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
            entity_type="BRANCH",
            entity_id=branch.id,
            action="CREATED",
            description=f"Branch '{branch.name}' was created.",
            new_values={
                "name": branch.name,
                "code": branch.code,
                "description": branch.description,
                "address": branch.address,
                "city": branch.city,
                "state": branch.state,
                "country": branch.country,
                "is_active": branch.is_active,
            },
        )

        db.commit()
        db.refresh(branch)

    except IntegrityError:
        db.rollback()
        raise ValueError("A branch with this name already exists.")

    return branch


def update_branch(
    db: Session,
    branch: Branch,
    *,
    user_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    country: str = "India",
    is_active: bool,
) -> Branch:
    old_values = {
        "name": branch.name,
        "code": branch.code,
        "description": branch.description,
        "address": branch.address,
        "city": branch.city,
        "state": branch.state,
        "country": branch.country,
        "is_active": branch.is_active,
    }

    old_is_active = branch.is_active

    branch.name = name.strip()
    branch.code = code.strip() if code else None
    branch.description = description.strip() if description else None
    branch.address = address.strip() if address else None
    branch.city = city.strip() if city else None
    branch.state = state.strip() if state else None
    branch.country = country.strip()
    branch.is_active = is_active

    new_values = {
        "name": branch.name,
        "code": branch.code,
        "description": branch.description,
        "address": branch.address,
        "city": branch.city,
        "state": branch.state,
        "country": branch.country,
        "is_active": branch.is_active,
    }

    if old_is_active != is_active:
        if is_active:
            action = "ENABLED"
            description = f"Branch '{branch.name}' was enabled."
        else:
            action = "DISABLED"
            description = f"Branch '{branch.name}' was disabled."
    else:
        action = "UPDATED"
        description = f"Branch '{branch.name}' was updated."

    try:
        db.flush()

        account_id = _get_account_id(
            db,
            branch.company_id,
        )

        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=branch.company_id,
            module="ORGANIZATION",
            entity_type="BRANCH",
            entity_id=branch.id,
            action=action,
            description=description,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(branch)

    except IntegrityError:
        db.rollback()
        raise ValueError("A branch with this name already exists.")

    return branch
