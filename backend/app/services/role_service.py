from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.scopes import SCOPES
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission

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
    cleaned_name = name.strip()

    if not cleaned_name:
        raise ValueError("Role name is required.")

    existing_role = (
        db.query(Role)
        .filter(
            Role.company_id == company_id,
            func.lower(Role.name) == cleaned_name.lower(),
        )
        .first()
    )

    if existing_role:
        raise ValueError("A role with this name already exists.")

    role = Role(
        company_id=company_id,
        name=cleaned_name,
        description=description,
        is_active=is_active,
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


def update_role_permissions(
    db: Session,
    company_id: int,
    role_id: int,
    permissions: list[dict],
) -> Role:
    role = get_role_by_id(
        db=db,
        company_id=company_id,
        role_id=role_id,
    )

    if not role:
        raise ValueError("Role not found.")

    if is_system_role(role.name):
        raise ValueError("System roles cannot have their permissions modified.")

    valid_scopes = {scope["code"] for scope in SCOPES}

    requested_pairs: set[tuple[str, str]] = set()

    permission_codes = {item["permission_code"].strip().upper() for item in permissions}

    if not permission_codes:
        permission_lookup = {}
    else:
        permission_rows = (
            db.query(Permission)
            .filter(
                Permission.code.in_(permission_codes),
            )
            .all()
        )

        permission_lookup = {
            permission.code: permission for permission in permission_rows
        }

    for item in permissions:
        permission_code = item["permission_code"].strip().upper()
        scope = item["scope"].strip().upper()

        if scope not in valid_scopes:
            raise ValueError(f"Invalid scope: {scope}.")

        if permission_code not in permission_lookup:
            raise ValueError(f"Permission not found: {permission_code}.")

        pair = (
            permission_code,
            scope,
        )

        if pair in requested_pairs:
            raise ValueError(
                f"Duplicate permission and scope: " f"{permission_code} / {scope}."
            )

        requested_pairs.add(pair)

    try:
        existing_role_permissions = (
            db.query(RolePermission)
            .filter(
                RolePermission.role_id == role.id,
            )
            .all()
        )

        for role_permission in existing_role_permissions:
            db.delete(role_permission)

        db.flush()

        for item in permissions:
            permission_code = item["permission_code"].strip().upper()
            scope = item["scope"].strip().upper()

            permission = permission_lookup[permission_code]

            db.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=permission.id,
                    scope=scope,
                )
            )

        db.commit()
        db.refresh(role)

    except Exception:
        db.rollback()
        raise

    return role

def update_role(
    db: Session,
    company_id: int,
    role_id: int,
    name: str,
    description: str | None,
    is_active: bool,
) -> Role:
    role = get_role_by_id(
        db=db,
        company_id=company_id,
        role_id=role_id,
    )

    if not role:
        raise ValueError("Role not found.")

    if is_system_role(role.name):
        raise ValueError(
            "System roles cannot be modified."
        )

    cleaned_name = name.strip()

    if not cleaned_name:
        raise ValueError("Role name is required.")

    existing_role = (
        db.query(Role)
        .filter(
            Role.company_id == company_id,
            Role.id != role_id,
            func.lower(Role.name) == cleaned_name.lower(),
        )
        .first()
    )

    if existing_role:
        raise ValueError(
            "A role with this name already exists."
        )

    role.name = cleaned_name
    role.description = description
    role.is_active = is_active

    db.commit()
    db.refresh(role)

    return role


def delete_role(
    db: Session,
    company_id: int,
    role_id: int,
) -> None:
    role = get_role_by_id(
        db=db,
        company_id=company_id,
        role_id=role_id,
    )

    if not role:
        raise ValueError("Role not found.")

    if is_system_role(role.name):
        raise ValueError(
            "System roles cannot be deleted."
        )

    db.delete(role)
    db.commit()