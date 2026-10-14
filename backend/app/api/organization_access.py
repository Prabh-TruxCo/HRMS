from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.company_membership import CompanyMembership
from app.models.organization_configuration import OrganizationConfiguration


OrganizationModule = Literal[
    "branches_enabled",
    "departments_enabled",
    "teams_enabled",
    "designations_enabled",
    "clients_enabled",
    "sites_enabled",
    "posts_enabled",
]


def validate_organization_module_access(
    db: Session,
    company_id: int,
    current_user,
    module: OrganizationModule,
) -> None:
    # 1. Verify active company membership.
    membership = (
        db.query(CompanyMembership)
        .filter(
            CompanyMembership.company_id == company_id,
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.is_active.is_(True),
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this company.",
        )

    # 2. Verify that the requested module is enabled.
    configuration = (
        db.query(OrganizationConfiguration)
        .filter(
            OrganizationConfiguration.company_id == company_id,
        )
        .first()
    )

    if configuration is None or not getattr(configuration, module, False):
        module_name = module.removesuffix("_enabled").replace("_", " ").title()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"{module_name} is not enabled for this organization. "
                "Contact your administrator."
            ),
        )