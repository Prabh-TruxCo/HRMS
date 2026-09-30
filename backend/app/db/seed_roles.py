from sqlalchemy import select

# Import models so SQLAlchemy registers all relationships
from app.models.user import User
from app.models.account import Account
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.membership_role import MembershipRole
from app.models.role_permission_scope_assignment import (
    RolePermissionScopeAssignment,
)
from app.models.organization_configuration import OrganizationConfiguration
from app.models.workforce_configuration import WorkforceConfiguration
from app.models.employment_type import EmploymentType

from app.core.roles import BUILT_IN_ROLES
from app.db.session import SessionLocal


def seed_roles() -> None:
    db = SessionLocal()

    try:
        companies = db.scalars(select(Company)).all()

        if not companies:
            print("No companies found. Nothing to seed.")
            return

        for company in companies:
            for role_data in BUILT_IN_ROLES:
                role = db.scalar(
                    select(Role).where(
                        Role.company_id == company.id,
                        Role.name == role_data["name"],
                    )
                )

                if not role:
                    role = Role(
                        company_id=company.id,
                        name=role_data["name"],
                        description=role_data["description"],
                        is_active=True,
                    )
                    db.add(role)
                    db.flush()
                else:
                    role.description = role_data["description"]
                    role.is_active = True

                for permission_code, scope in role_data["permissions"]:
                    permission = db.scalar(
                        select(Permission).where(Permission.code == permission_code)
                    )

                    if not permission:
                        print(
                            f"Warning: permission '{permission_code}' "
                            f"not found. Skipping."
                        )
                        continue

                    existing_mapping = db.scalar(
                        select(RolePermission).where(
                            RolePermission.role_id == role.id,
                            RolePermission.permission_id == permission.id,
                            RolePermission.scope == scope,
                        )
                    )

                    if existing_mapping:
                        continue

                    db.add(
                        RolePermission(
                            role_id=role.id,
                            permission_id=permission.id,
                            scope=scope,
                        )
                    )

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles()
    print("Roles seeded successfully.")
