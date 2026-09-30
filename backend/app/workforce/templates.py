from dataclasses import dataclass


@dataclass(frozen=True)
class WorkforceTemplate:
    attendance_enabled: bool = True
    attendance_methods: tuple[str, ...] = ("web",)

    late_marking_enabled: bool = True
    grace_period_minutes: int = 10
    early_checkout_enabled: bool = False
    auto_markout_enabled: bool = False
    attendance_regularization_enabled: bool = True
    attendance_approval_required: bool = False

    shifts_enabled: bool = False

    overtime_enabled: bool = False
    overtime_approval_required: bool = True

    remote_work_enabled: bool = False
    field_work_enabled: bool = False
    gps_attendance_enabled: bool = False
    geofencing_enabled: bool = False

    employment_types: tuple[str, ...] = (
        "Full Time",
        "Part Time",
        "Contract",
    )


INDUSTRY_TEMPLATES = {
    # ---------------------------------------------------------
    # IT & SOFTWARE
    # ---------------------------------------------------------
    "it & software": WorkforceTemplate(
        attendance_methods=("web", "mobile", "face"),
        remote_work_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Intern",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # CORPORATE
    # ---------------------------------------------------------
    "corporate": WorkforceTemplate(
        attendance_methods=("web", "mobile", "face"),
        remote_work_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # LOGISTICS
    # ---------------------------------------------------------
    "logistics": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # HEALTHCARE
    # ---------------------------------------------------------
    "healthcare": WorkforceTemplate(
        attendance_methods=("device", "face", "mobile"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # SECURITY & FACILITY
    # ---------------------------------------------------------
    "security & facility": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        overtime_approval_required=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
        auto_markout_enabled=True,
        attendance_approval_required=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # MANUFACTURING
    # ---------------------------------------------------------
    "manufacturing": WorkforceTemplate(
        attendance_methods=("device", "face"),
        shifts_enabled=True,
        overtime_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
            "Apprentice",
        ),
    ),
    # ---------------------------------------------------------
    # RETAIL
    # ---------------------------------------------------------
    "retail": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # HOSPITALITY
    # ---------------------------------------------------------
    "hospitality": WorkforceTemplate(
        attendance_methods=("device", "face", "mobile"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # EDUCATION
    # ---------------------------------------------------------
    "education": WorkforceTemplate(
        attendance_methods=("web", "face"),
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # FIELD SERVICE
    # ---------------------------------------------------------
    "field service": WorkforceTemplate(
        attendance_methods=("mobile", "face"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
        attendance_approval_required=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
    # ---------------------------------------------------------
    # OTHER
    # ---------------------------------------------------------
    "other": WorkforceTemplate(
        attendance_methods=("web", "mobile"),
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
        ),
    ),
}


DEFAULT_TEMPLATE = WorkforceTemplate()


def get_workforce_template(
    industry_type: str | None,
) -> WorkforceTemplate:
    if not industry_type:
        return DEFAULT_TEMPLATE

    normalized = industry_type.strip().lower()

    return INDUSTRY_TEMPLATES.get(
        normalized,
        DEFAULT_TEMPLATE,
    )
