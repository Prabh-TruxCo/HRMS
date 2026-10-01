from sqlalchemy.orm import Session

from app.models.company_membership import CompanyMembership
from app.models.membership_role import MembershipRole
from app.models.role import Role
from app.models.role_permission_scope_assignment import (
    RolePermissionScopeAssignment,
)


def get_membership(
    db: Session,
    company_id: int,
    membership_id: int,
) -> CompanyMembership | None:
    return (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.id == membership_id,
            CompanyMembership.company_id == company_id,
        )
        .first()
    )


def get_member_roles(
    db: Session,
    company_id: int,
    membership_id: int,
) -> dict:
    membership = get_membership(
        db=db,
        company_id=company_id,
        membership_id=membership_id,
    )

    if not membership:
        raise ValueError("Membership not found.")

    rows = (
        db.query(MembershipRole, Role)
        .join(Role, Role.id == MembershipRole.role_id)
        .filter(
            MembershipRole.membership_id == membership.id,
            Role.company_id == company_id,
        )
        .order_by(Role.name.asc())
        .all()
    )

    roles = []

    for membership_role, role in rows:
        assignments = (
            db.query(RolePermissionScopeAssignment)
            .filter(
                RolePermissionScopeAssignment.membership_id == membership.id,
                RolePermissionScopeAssignment.role_id == role.id,
            )
            .order_by(
                RolePermissionScopeAssignment.scope.asc(),
                RolePermissionScopeAssignment.scope_entity_id.asc(),
            )
            .all()
        )

        grouped_scopes: dict[str, list[int]] = {}

        for assignment in assignments:
            grouped_scopes.setdefault(
                assignment.scope,
                [],
            ).append(assignment.scope_entity_id)

        roles.append(
            {
                "role": {
                    "id": role.id,
                    "name": role.name,
                    "description": role.description,
                    "is_active": role.is_active,
                },
                "scope_assignments": [
                    {
                        "scope": scope,
                        "scope_entity_ids": entity_ids,
                    }
                    for scope, entity_ids in grouped_scopes.items()
                ],
            }
        )

    return {
        "membership_id": membership.id,
        "user_id": membership.user_id,
        "company_id": membership.company_id,
        "roles": roles,
    }


def update_member_roles(
    db: Session,
    company_id: int,
    membership_id: int,
    roles: list[dict],
) -> dict:
    membership = get_membership(
        db=db,
        company_id=company_id,
        membership_id=membership_id,
    )

    if not membership:
        raise ValueError("Membership not found.")

    role_ids = [item["role_id"] for item in roles]

    if len(role_ids) != len(set(role_ids)):
        raise ValueError("Duplicate roles are not allowed.")

    company_roles = (
        db.query(Role)
        .filter(
            Role.company_id == company_id,
            Role.id.in_(role_ids),
        )
        .all()
        if role_ids
        else []
    )

    role_lookup = {role.id: role for role in company_roles}

    missing_role_ids = set(role_ids) - set(role_lookup)

    if missing_role_ids:
        raise ValueError(f"Invalid role IDs: {sorted(missing_role_ids)}.")

    try:
        db.query(MembershipRole).filter(
            MembershipRole.membership_id == membership.id,
        ).delete(
            synchronize_session=False,
        )

        db.query(RolePermissionScopeAssignment).filter(
            RolePermissionScopeAssignment.membership_id == membership.id,
        ).delete(
            synchronize_session=False,
        )

        for item in roles:
            role_id = item["role_id"]

            db.add(
                MembershipRole(
                    membership_id=membership.id,
                    role_id=role_id,
                )
            )

            role_scope_assignments = item.get(
                "scope_assignments",
                [],
            )

            role = role_lookup[role_id]

            for scope_assignment in role_scope_assignments:
                scope = scope_assignment["scope"]
                entity_ids = scope_assignment.get(
                    "scope_entity_ids",
                    [],
                )

                if scope == "SELF" and entity_ids:
                    raise ValueError(
                        f"SELF scope cannot have entity IDs for role " f"'{role.name}'."
                    )

                if scope == "COMPANY" and entity_ids:
                    raise ValueError(
                        f"COMPANY scope cannot have entity IDs for role "
                        f"'{role.name}'."
                    )

                for entity_id in set(entity_ids):
                    db.add(
                        RolePermissionScopeAssignment(
                            membership_id=membership.id,
                            role_id=role_id,
                            scope=scope,
                            scope_entity_id=entity_id,
                        )
                    )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return get_member_roles(
        db=db,
        company_id=company_id,
        membership_id=membership_id,
    )
