from sqlalchemy.orm import Session

from app.models.workforce_configuration import WorkforceConfiguration


def get_workforce_configuration(
    db: Session,
    company_id: int,
) -> WorkforceConfiguration:
    configuration = (
        db.query(WorkforceConfiguration)
        .filter(WorkforceConfiguration.company_id == company_id)
        .first()
    )

    if not configuration:
        configuration = WorkforceConfiguration(
            company_id=company_id,
            attendance_mode="manual",
            shifts_enabled=False,
            overtime_enabled=False,
            late_marking_enabled=True,
            grace_period_minutes=10,
        )

        db.add(configuration)
        db.commit()
        db.refresh(configuration)

    return configuration


def update_workforce_configuration(
    db: Session,
    company_id: int,
    attendance_mode: str,
    shifts_enabled: bool,
    overtime_enabled: bool,
    late_marking_enabled: bool,
    grace_period_minutes: int,
) -> WorkforceConfiguration:
    configuration = get_workforce_configuration(
        db=db,
        company_id=company_id,
    )

    configuration.attendance_mode = attendance_mode
    configuration.shifts_enabled = shifts_enabled
    configuration.overtime_enabled = overtime_enabled
    configuration.late_marking_enabled = late_marking_enabled
    configuration.grace_period_minutes = grace_period_minutes

    db.commit()
    db.refresh(configuration)

    return configuration
