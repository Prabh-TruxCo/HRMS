from sqlalchemy.orm import Session

from app.models.employment_type import EmploymentType
from app.models.workforce_configuration import WorkforceConfiguration
from app.workforce.templates import (
    WorkforceTemplate,
    get_workforce_template,
)


def _create_recommended_employment_types(
    db: Session,
    company_id: int,
    template: WorkforceTemplate,
) -> None:
    existing_names = {
        name.lower()
        for (name,) in (
            db.query(EmploymentType.name)
            .filter(
                EmploymentType.company_id == company_id,
            )
            .all()
        )
    }

    for employment_type_name in template.employment_types:
        if employment_type_name.lower() in existing_names:
            continue

        db.add(
            EmploymentType(
                company_id=company_id,
                name=employment_type_name,
                is_active=True,
            )
        )


def get_workforce_recommendation(
    company_id: int,
    industry_type: str | None,
) -> WorkforceTemplate:
    """
    Return the recommended workforce template.

    This function does NOT save anything to the database.
    """

    return get_workforce_template(industry_type)


def get_workforce_configuration(
    db: Session,
    company_id: int,
) -> WorkforceConfiguration | None:
    """
    Return the saved workforce configuration.

    Does not create or modify configuration.
    """

    return (
        db.query(WorkforceConfiguration)
        .filter(
            WorkforceConfiguration.company_id == company_id,
        )
        .first()
    )


def update_workforce_configuration(
    db: Session,
    company_id: int,
    industry_type: str | None,
    setup_mode: str,
    attendance_enabled: bool,
    attendance_methods: list[str],
    late_marking_enabled: bool,
    grace_period_minutes: int,
    early_checkout_enabled: bool,
    auto_markout_enabled: bool,
    attendance_regularization_enabled: bool,
    attendance_approval_required: bool,
    shifts_enabled: bool,
    overtime_enabled: bool,
    overtime_approval_required: bool,
    remote_work_enabled: bool,
    field_work_enabled: bool,
    gps_attendance_enabled: bool,
    geofencing_enabled: bool,
) -> WorkforceConfiguration:

    configuration = (
        db.query(WorkforceConfiguration)
        .filter(
            WorkforceConfiguration.company_id == company_id,
        )
        .first()
    )

    # First save:
    # create the configuration and recommended employment types.
    if not configuration:
        configuration = WorkforceConfiguration(
            company_id=company_id,
        )

        db.add(configuration)

        template = get_workforce_template(industry_type)

        _create_recommended_employment_types(
            db=db,
            company_id=company_id,
            template=template,
        )

    configuration.setup_mode = setup_mode

    configuration.attendance_enabled = attendance_enabled
    configuration.attendance_methods = list(attendance_methods)

    configuration.late_marking_enabled = late_marking_enabled
    configuration.grace_period_minutes = grace_period_minutes
    configuration.early_checkout_enabled = early_checkout_enabled
    configuration.auto_markout_enabled = auto_markout_enabled

    configuration.attendance_regularization_enabled = attendance_regularization_enabled
    configuration.attendance_approval_required = attendance_approval_required

    configuration.shifts_enabled = shifts_enabled

    configuration.overtime_enabled = overtime_enabled
    configuration.overtime_approval_required = overtime_approval_required

    configuration.remote_work_enabled = remote_work_enabled
    configuration.field_work_enabled = field_work_enabled
    configuration.gps_attendance_enabled = gps_attendance_enabled
    configuration.geofencing_enabled = geofencing_enabled

    db.commit()
    db.refresh(configuration)

    return configuration
