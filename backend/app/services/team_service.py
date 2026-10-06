from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.department import Department
from app.models.team import Team
from app.services.audit_log_service import AuditLogService


def _get_account_id(db: Session, company_id: int) -> int:
    company = db.get(Company, company_id)

    if company is None:
        raise ValueError("Company not found.")

    return company.account_id


def _get_department(
    db: Session,
    company_id: int,
    department_id: int,
) -> Department | None:
    statement = select(Department).where(
        Department.id == department_id,
        Department.company_id == company_id,
    )

    return db.scalar(statement)


def list_teams(
    db: Session,
    company_id: int,
    department_id: int | None = None,
) -> list[Team]:
    statement = (
        select(Team)
        .join(Department, Team.department_id == Department.id)
        .where(Department.company_id == company_id)
    )

    if department_id is not None:
        statement = statement.where(
            Team.department_id == department_id
        )

    statement = statement.order_by(Team.name.asc())

    return list(db.scalars(statement).all())


def get_team(
    db: Session,
    company_id: int,
    team_id: int,
) -> Team | None:
    statement = (
        select(Team)
        .join(Department, Team.department_id == Department.id)
        .where(
            Team.id == team_id,
            Department.company_id == company_id,
        )
    )

    return db.scalar(statement)


def create_team(
    db: Session,
    company_id: int,
    *,
    user_id: int,
    department_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    is_active: bool = True,
) -> Team:
    department = _get_department(
        db,
        company_id,
        department_id,
    )

    if department is None:
        raise ValueError(
            "Department not found for this company."
        )

    team = Team(
        department_id=department_id,
        name=name.strip(),
        code=code.strip() if code else None,
        description=description.strip() if description else None,
        is_active=is_active,
    )

    db.add(team)

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
            entity_type="TEAM",
            entity_id=team.id,
            action="CREATED",
            description=f"Team '{team.name}' was created.",
            new_values={
                "department_id": team.department_id,
                "name": team.name,
                "code": team.code,
                "description": team.description,
                "is_active": team.is_active,
            },
        )

        db.commit()
        db.refresh(team)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A team with this name already exists in this department."
        )

    return team


def update_team(
    db: Session,
    team: Team,
    *,
    user_id: int,
    company_id: int,
    department_id: int,
    name: str,
    code: str | None = None,
    description: str | None = None,
    is_active: bool = True,
) -> Team:
    department = _get_department(
        db,
        company_id,
        department_id,
    )

    if department is None:
        raise ValueError(
            "Department not found for this company."
        )

    old_values = {
        "department_id": team.department_id,
        "name": team.name,
        "code": team.code,
        "description": team.description,
        "is_active": team.is_active,
    }

    old_is_active = team.is_active

    team.department_id = department_id
    team.name = name.strip()
    team.code = code.strip() if code else None
    team.description = (
        description.strip() if description else None
    )
    team.is_active = is_active

    new_values = {
        "department_id": team.department_id,
        "name": team.name,
        "code": team.code,
        "description": team.description,
        "is_active": team.is_active,
    }

    if old_is_active != is_active:
        if is_active:
            action = "ENABLED"
            audit_description = (
                f"Team '{team.name}' was enabled."
            )
        else:
            action = "DISABLED"
            audit_description = (
                f"Team '{team.name}' was disabled."
            )
    else:
        action = "UPDATED"
        audit_description = (
            f"Team '{team.name}' was updated."
        )

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
            entity_type="TEAM",
            entity_id=team.id,
            action=action,
            description=audit_description,
            old_values=old_values,
            new_values=new_values,
        )

        db.commit()
        db.refresh(team)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "A team with this name already exists in this department."
        )

    return team