from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User


SYSTEM_ROLE_NAMES = {
    "Owner",
    "Company Admin",
    "HR Manager",
    "Attendance Manager",
    "Leave Manager",
    "Payroll Manager",
    "Task Manager",
    "Ticket Manager",
    "Asset Manager",
    "Team Manager",
    "Employee",
}


def is_system_role(role_name: str) -> bool:
    return role_name in SYSTEM_ROLE_NAMES


def get_company_roles(
    db: Session,
    company_id: int,
) -> list[dict]:
    permission_counts = (
        db.query(
            RolePermission.role_id,
            func.count(RolePermission.id).label("permissions_count"),
        )
        .group_by(RolePermission.role_id)
        .subquery()
    )

    rows = (
        db.query(
            Role,
            func.coalesce(
                permission_counts.c.permissions_count,
                0,
            ).label("permissions_count"),
        )
        .outerjoin(
            permission_counts,
            permission_counts.c.role_id == Role.id,
        )
        .filter(
            Role.company_id == company_id,
        )
        .order_by(Role.name.asc())
        .all()
    )

    return [
        {
            "id": role.id,
            "company_id": role.company_id,
            "name": role.name,
            "description": role.description,
            "is_active": role.is_active,
            "permissions_count": permissions_count,
            "is_system_role": is_system_role(role.name),
        }
        for role, permissions_count in rows
    ]


def get_role_by_id(
    db: Session,
    company_id: int,
    role_id: int,
) -> Role | None:
    return (
        db.query(Role)
        .filter(
            Role.id == role_id,
            Role.company_id == company_id,
        )
        .first()
    )


def get_role_permissions(
    db: Session,
    role_id: int,
) -> list[dict]:
    rows = (
        db.query(
            RolePermission,
            Permission,
        )
        .join(
            Permission,
            Permission.id == RolePermission.permission_id,
        )
        .filter(
            RolePermission.role_id == role_id,
        )
        .order_by(
            Permission.module.asc(),
            Permission.code.asc(),
            RolePermission.scope.asc(),
        )
        .all()
    )

    return [
        {
            "id": role_permission.id,
            "permission_id": permission.id,
            "permission_code": permission.code,
            "permission_name": permission.name,
            "module": permission.module,
            "scope": role_permission.scope,
        }
        for role_permission, permission in rows
    ]
    
def create_role(
    db: Session,
    company_id: int,
    name: str,
    description: str | None,
    is_active: bool,
) -> Role:
    existing_role = (
        db.query(Role)
        .filter(
            Role.company_id == company_id,
            func.lower(Role.name) == name.strip().lower(),
        )
        .first()
    )

    if existing_role:
        raise ValueError("A role with this name already exists.")

    role = Role(
        company_id=company_id,
        name=name.strip(),
        description=description,
        is_active=is_active,
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role    