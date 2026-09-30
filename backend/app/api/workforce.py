from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.workforce import (
    WorkforceConfigurationResponse,
    WorkforceConfigurationUpdateRequest,
    WorkforceRecommendationResponse,
)
from app.services.company_service import get_company_for_user
from app.services.workforce_service import (
    get_workforce_configuration,
    get_workforce_recommendation,
    update_workforce_configuration,
)

router = APIRouter(
    prefix="/companies",
    tags=["Workforce"],
)


@router.get(
    "/{company_id}/workforce",
    response_model=WorkforceConfigurationResponse,
)
def get_workforce(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company: Company = get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    configuration = get_workforce_configuration(
        db=db,
        company_id=company.id,
    )

    if configuration is None:
        raise HTTPException(
            status_code=404,
            detail="Workforce configuration has not been saved yet.",
        )

    return configuration


@router.get(
    "/{company_id}/workforce/recommendation",
    response_model=WorkforceRecommendationResponse,
)
def get_workforce_recommendation_for_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company: Company = get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    template = get_workforce_recommendation(
        company_id=company.id,
        industry_type=company.industry_type,
    )

    return WorkforceRecommendationResponse(
        industry_type=company.industry_type,
        setup_mode="recommended",
        attendance_enabled=template.attendance_enabled,
        attendance_methods=list(template.attendance_methods),
        late_marking_enabled=template.late_marking_enabled,
        grace_period_minutes=template.grace_period_minutes,
        early_checkout_enabled=template.early_checkout_enabled,
        auto_markout_enabled=template.auto_markout_enabled,
        attendance_regularization_enabled=(template.attendance_regularization_enabled),
        attendance_approval_required=(template.attendance_approval_required),
        shifts_enabled=template.shifts_enabled,
        overtime_enabled=template.overtime_enabled,
        overtime_approval_required=(template.overtime_approval_required),
        remote_work_enabled=template.remote_work_enabled,
        field_work_enabled=template.field_work_enabled,
        gps_attendance_enabled=template.gps_attendance_enabled,
        geofencing_enabled=template.geofencing_enabled,
        recommended_employment_types=list(template.employment_types),
    )


@router.put(
    "/{company_id}/workforce",
    response_model=WorkforceConfigurationResponse,
)
def update_workforce(
    company_id: int,
    data: WorkforceConfigurationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company: Company = get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    return update_workforce_configuration(
        db=db,
        company_id=company.id,
        industry_type=company.industry_type,
        setup_mode=data.setup_mode,
        attendance_enabled=data.attendance_enabled,
        attendance_methods=data.attendance_methods,
        late_marking_enabled=data.late_marking_enabled,
        grace_period_minutes=data.grace_period_minutes,
        early_checkout_enabled=data.early_checkout_enabled,
        auto_markout_enabled=data.auto_markout_enabled,
        attendance_regularization_enabled=(data.attendance_regularization_enabled),
        attendance_approval_required=(data.attendance_approval_required),
        shifts_enabled=data.shifts_enabled,
        overtime_enabled=data.overtime_enabled,
        overtime_approval_required=(data.overtime_approval_required),
        remote_work_enabled=data.remote_work_enabled,
        field_work_enabled=data.field_work_enabled,
        gps_attendance_enabled=data.gps_attendance_enabled,
        geofencing_enabled=data.geofencing_enabled,
    )
