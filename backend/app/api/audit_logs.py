from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company_membership import CompanyMembership
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_log_service import AuditLogService


router = APIRouter(
    prefix="/companies/{company_id}/audit-logs",
    tags=["Audit Logs"],
)


def validate_company_membership(
    db: Session,
    user_id: int,
    company_id: int,
) -> None:
    membership = db.query(CompanyMembership).filter(
        CompanyMembership.user_id == user_id,
        CompanyMembership.company_id == company_id,
        CompanyMembership.is_active.is_(True),
    ).first()

    if membership is None:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this company.",
        )


# ---------------------------------------------------------
# ALL COMPANY AUDIT LOGS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_company_audit_logs(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    service = AuditLogService(db)

    return service.get_company_logs(
        company_id,
    )


# ---------------------------------------------------------
# LOGS FOR ONE ENTITY TYPE
# ---------------------------------------------------------

@router.get(
    "/{entity_type}",
    response_model=list[AuditLogResponse],
)
def get_company_entity_logs(
    company_id: int,
    entity_type: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    service = AuditLogService(db)

    return service.get_company_entity_logs(
        company_id,
        entity_type,
    )


# ---------------------------------------------------------
# LOGS FOR ONE ENTITY
# ---------------------------------------------------------

@router.get(
    "/{entity_type}/{entity_id}",
    response_model=list[AuditLogResponse],
)
def get_entity_audit_logs(
    company_id: int,
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_company_membership(
        db,
        current_user.id,
        company_id,
    )

    service = AuditLogService(db)

    return service.get_entity_logs(
        company_id,
        entity_type,
        entity_id,
    )