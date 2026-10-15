from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.workforce_service import get_workforce_configuration


def validate_shift_access(
    db: Session,
    company_id: int,
) -> None:
    configuration = get_workforce_configuration(
        db=db,
        company_id=company_id,
    )

    if configuration is None or not configuration.shifts_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Shifts are not enabled for this company. "
                "Enable Shifts in Workforce settings first."
            ),
        )