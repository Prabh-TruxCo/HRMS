from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.member_role import (
    MemberRolesResponse,
    MemberRolesUpdateRequest,
)
from app.services.company_service import get_company_for_user
from app.services.member_role_service import (
    get_member_roles,
    update_member_roles,
)

router = APIRouter(
    prefix="/companies/{company_id}/members",
    tags=["Member Roles"],
)


@router.get(
    "/{membership_id}/roles",
    response_model=MemberRolesResponse,
)
def get_member_roles_endpoint(
    company_id: int,
    membership_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db=db,
        user=current_user,
        company_id=company_id,
    )

    try:
        return get_member_roles(
            db=db,
            company_id=company_id,
            membership_id=membership_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.put(
    "/{membership_id}/roles",
    response_model=MemberRolesResponse,
)
def update_member_roles_endpoint(
    company_id: int,
    membership_id: int,
    request: MemberRolesUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    get_company_for_user(
        db=db,
        user=current_user,
        company_id=company_id,
    )

    try:
        return update_member_roles(
            db=db,
            company_id=company_id,
            membership_id=membership_id,
            roles=[role.model_dump() for role in request.roles],
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
