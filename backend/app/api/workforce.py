from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.workforce import (
    WorkforceConfigurationResponse,
    WorkforceConfigurationUpdateRequest,
)
from app.services.company_service import get_company_for_user
from app.services.workforce_service import (
    get_workforce_configuration,
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
    get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    return get_workforce_configuration(
        db=db,
        company_id=company_id,
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
    get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    return update_workforce_configuration(
        db=db,
        company_id=company_id,
        attendance_mode=data.attendance_mode,
        shifts_enabled=data.shifts_enabled,
        overtime_enabled=data.overtime_enabled,
        late_marking_enabled=data.late_marking_enabled,
        grace_period_minutes=data.grace_period_minutes,
    )