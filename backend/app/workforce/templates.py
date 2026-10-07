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
    # SECURITY
    # ---------------------------------------------------------
    "SECURITY": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        overtime_approval_required=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
        auto_markout_enabled=True,
        attendance_approval_required=True,
    ),
    # ---------------------------------------------------------
    # IT / TECHNOLOGY
    # ---------------------------------------------------------
    "IT": WorkforceTemplate(
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
    # BPO / BACK OFFICE
    # ---------------------------------------------------------
    "BPO": WorkforceTemplate(
        attendance_methods=("web", "mobile", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        employment_types=(
            "Full Time",
            "Part Time",
            "Contract",
            "Intern",
        ),
    ),
    # ---------------------------------------------------------
    # HOSPITALITY
    # ---------------------------------------------------------
    "HOSPITALITY": WorkforceTemplate(
        attendance_methods=("device", "face", "mobile"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
    ),
    # ---------------------------------------------------------
    # RETAIL
    # ---------------------------------------------------------
    "RETAIL": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
    ),
    # ---------------------------------------------------------
    # MANUFACTURING
    # ---------------------------------------------------------
    "MANUFACTURING": WorkforceTemplate(
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
    # HEALTHCARE
    # ---------------------------------------------------------
    "HEALTHCARE": WorkforceTemplate(
        attendance_methods=("device", "face", "mobile"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
    ),
    # ---------------------------------------------------------
    # EDUCATION
    # ---------------------------------------------------------
    "EDUCATION": WorkforceTemplate(
        attendance_methods=("web", "face"),
    ),
    # ---------------------------------------------------------
    # LOGISTICS
    # ---------------------------------------------------------
    "LOGISTICS": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
    ),
    # ---------------------------------------------------------
    # FACILITY MANAGEMENT
    # ---------------------------------------------------------
    "FACILITY_MANAGEMENT": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
        attendance_approval_required=True,
    ),
    # ---------------------------------------------------------
    # STAFFING / MANPOWER
    # ---------------------------------------------------------
    "STAFFING": WorkforceTemplate(
        attendance_methods=("mobile", "face", "device"),
        shifts_enabled=True,
        overtime_enabled=True,
        field_work_enabled=True,
        gps_attendance_enabled=True,
        geofencing_enabled=True,
    ),
    # ---------------------------------------------------------
    # OTHER
    # ---------------------------------------------------------
    "OTHER": WorkforceTemplate(
        attendance_methods=("web", "mobile"),
    ),
}


DEFAULT_TEMPLATE = WorkforceTemplate()


def get_workforce_template(
    industry_codes: list[str],
) -> WorkforceTemplate:
    """
    Build a workforce recommendation from all selected industries.

    Recommendations are merged across industries:
    - Boolean capabilities use OR.
    - Attendance methods are combined.
    - Employment types are combined.
    """

    normalized_codes = {
        code.strip().upper() for code in industry_codes if code and code.strip()
    }

    if not normalized_codes:
        return DEFAULT_TEMPLATE

    templates = [
        INDUSTRY_TEMPLATES[code]
        for code in normalized_codes
        if code in INDUSTRY_TEMPLATES
    ]

    if not templates:
        return DEFAULT_TEMPLATE

    attendance_methods = tuple(
        dict.fromkeys(
            method for template in templates for method in template.attendance_methods
        )
    )

    employment_types = tuple(
        dict.fromkeys(
            employment_type
            for template in templates
            for employment_type in template.employment_types
        )
    )

    return WorkforceTemplate(
        attendance_enabled=any(template.attendance_enabled for template in templates),
        attendance_methods=attendance_methods or ("web",),
        late_marking_enabled=any(
            template.late_marking_enabled for template in templates
        ),
        grace_period_minutes=max(
            template.grace_period_minutes for template in templates
        ),
        early_checkout_enabled=any(
            template.early_checkout_enabled for template in templates
        ),
        auto_markout_enabled=any(
            template.auto_markout_enabled for template in templates
        ),
        attendance_regularization_enabled=any(
            template.attendance_regularization_enabled for template in templates
        ),
        attendance_approval_required=any(
            template.attendance_approval_required for template in templates
        ),
        shifts_enabled=any(template.shifts_enabled for template in templates),
        overtime_enabled=any(template.overtime_enabled for template in templates),
        overtime_approval_required=any(
            template.overtime_approval_required for template in templates
        ),
        remote_work_enabled=any(template.remote_work_enabled for template in templates),
        field_work_enabled=any(template.field_work_enabled for template in templates),
        gps_attendance_enabled=any(
            template.gps_attendance_enabled for template in templates
        ),
        geofencing_enabled=any(template.geofencing_enabled for template in templates),
        employment_types=employment_types or DEFAULT_TEMPLATE.employment_types,
    )
