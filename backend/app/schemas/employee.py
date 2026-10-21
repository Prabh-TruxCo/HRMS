from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EmployeeCreateRequest(BaseModel):
    employee_code: str | None = Field(default=None, min_length=1, max_length=50)

    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=200)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)

    personal_email: str | None = Field(default=None, max_length=255)
    work_email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    alternate_phone: str | None = Field(default=None, max_length=30)

    user_id: int | None = Field(default=None, gt=0)
    department_id: int | None = Field(default=None, gt=0)
    designation_id: int | None = Field(default=None, gt=0)
    team_id: int | None = Field(default=None, gt=0)
    branch_id: int | None = Field(default=None, gt=0)
    office_location_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    post_id: int | None = Field(default=None, gt=0)
    employment_type_id: int | None = Field(default=None, gt=0)
    manager_id: int | None = Field(default=None, gt=0)

    joining_date: date | None = None
    probation_end_date: date | None = None
    confirmation_date: date | None = None
    employment_end_date: date | None = None

    employment_status: str = Field(default="DRAFT", min_length=1, max_length=30)
    is_active: bool = True

    height_cm: float | None = Field(default=None, gt=0, le=300)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    notes: str | None = None

    custom_fields: dict[str, Any] = Field(default_factory=dict)


class EmployeeUpdateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=200)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)

    personal_email: str | None = Field(default=None, max_length=255)
    work_email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=30)
    alternate_phone: str | None = Field(default=None, max_length=30)

    user_id: int | None = Field(default=None, gt=0)
    department_id: int | None = Field(default=None, gt=0)
    designation_id: int | None = Field(default=None, gt=0)
    team_id: int | None = Field(default=None, gt=0)
    branch_id: int | None = Field(default=None, gt=0)
    office_location_id: int | None = Field(default=None, gt=0)
    site_id: int | None = Field(default=None, gt=0)
    post_id: int | None = Field(default=None, gt=0)
    employment_type_id: int | None = Field(default=None, gt=0)
    manager_id: int | None = Field(default=None, gt=0)

    joining_date: date | None = None
    probation_end_date: date | None = None
    confirmation_date: date | None = None
    employment_end_date: date | None = None

    employment_status: str = Field(min_length=1, max_length=30)
    is_active: bool

    height_cm: float | None = Field(default=None, gt=0, le=300)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    notes: str | None = None

    custom_fields: dict[str, Any] = Field(default_factory=dict)


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    user_id: int | None

    employee_code: str
    first_name: str
    middle_name: str | None
    last_name: str | None
    display_name: str | None

    date_of_birth: date | None
    gender: str | None
    personal_email: str | None
    work_email: str | None
    phone: str | None
    alternate_phone: str | None

    department_id: int | None
    designation_id: int | None
    team_id: int | None
    branch_id: int | None
    office_location_id: int | None
    site_id: int | None
    post_id: int | None
    employment_type_id: int | None
    manager_id: int | None

    joining_date: date | None
    probation_end_date: date | None
    confirmation_date: date | None
    employment_end_date: date | None

    employment_status: str
    is_active: bool
    height_cm: float | None
    weight_kg: float | None
    notes: str | None

    created_at: datetime
    updated_at: datetime


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
