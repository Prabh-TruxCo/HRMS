from typing import Literal

from pydantic import BaseModel, Field

AttendanceMethod = Literal[
    "web",
    "mobile",
    "face",
    "device",
]


class WorkforceConfigurationResponse(BaseModel):
    company_id: int
    setup_mode: str

    attendance_enabled: bool
    attendance_methods: list[AttendanceMethod]
    late_marking_enabled: bool
    grace_period_minutes: int
    early_checkout_enabled: bool
    auto_markout_enabled: bool
    attendance_regularization_enabled: bool
    attendance_approval_required: bool

    shifts_enabled: bool

    overtime_enabled: bool
    overtime_approval_required: bool

    remote_work_enabled: bool
    field_work_enabled: bool
    gps_attendance_enabled: bool
    geofencing_enabled: bool

    model_config = {"from_attributes": True}


class WorkforceConfigurationUpdateRequest(BaseModel):
    setup_mode: Literal["recommended", "custom"]

    attendance_enabled: bool
    attendance_methods: list[AttendanceMethod] = Field(
        min_length=1,
    )
    late_marking_enabled: bool
    grace_period_minutes: int = Field(
        ge=0,
        le=120,
    )
    early_checkout_enabled: bool
    auto_markout_enabled: bool
    attendance_regularization_enabled: bool
    attendance_approval_required: bool

    shifts_enabled: bool

    overtime_enabled: bool
    overtime_approval_required: bool

    remote_work_enabled: bool
    field_work_enabled: bool
    gps_attendance_enabled: bool
    geofencing_enabled: bool


class WorkforceRecommendationResponse(BaseModel):
    industry_type: str
    setup_mode: str

    attendance_enabled: bool
    attendance_methods: list[AttendanceMethod]
    late_marking_enabled: bool
    grace_period_minutes: int
    early_checkout_enabled: bool
    auto_markout_enabled: bool
    attendance_regularization_enabled: bool
    attendance_approval_required: bool

    shifts_enabled: bool

    overtime_enabled: bool
    overtime_approval_required: bool

    remote_work_enabled: bool
    field_work_enabled: bool
    gps_attendance_enabled: bool
    geofencing_enabled: bool

    recommended_employment_types: list[str]
