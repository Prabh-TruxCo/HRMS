from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company import Company
from app.models.company_membership import CompanyMembership
from app.models.membership_role import MembershipRole
from app.models.role import Role
from app.models.user import User
from app.schemas.membership import CompanyRoleResponse


router = APIRouter(
    prefix="/membership",
    tags=["Membership"],
)


@router.get(
    "/company/{company_id}/roles",
    response_model=CompanyRoleResponse,
)
def get_company_roles(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.scalar(
        select(CompanyMembership).where(
            CompanyMembership.user_id == current_user.id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.is_active.is_(True),
        )
    )

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this company.",
        )

    roles = db.scalars(
        select(Role)
        .join(
            MembershipRole,
            MembershipRole.role_id == Role.id,
        )
        .where(
            MembershipRole.membership_id == membership.id,
            Role.is_active.is_(True),
        )
        .order_by(Role.name)
    ).all()

    return {
        "company_id": company_id,
        "role_names": [role.name for role in roles],
    }