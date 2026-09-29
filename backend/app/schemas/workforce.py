from pydantic import BaseModel, Field


class WorkforceConfigurationResponse(BaseModel):
    company_id: int
    attendance_mode: str
    shifts_enabled: bool
    overtime_enabled: bool
    late_marking_enabled: bool
    grace_period_minutes: int

    model_config = {"from_attributes": True}


class WorkforceConfigurationUpdateRequest(BaseModel):
    attendance_mode: str = Field(
        min_length=1,
        max_length=30,
    )
    shifts_enabled: bool
    overtime_enabled: bool
    late_marking_enabled: bool
    grace_period_minutes: int = Field(
        ge=0,
        le=120,
    )