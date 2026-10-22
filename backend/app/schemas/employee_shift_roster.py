from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class EmployeeShiftRosterDayBase(BaseModel):
    # Monday = 0, Sunday = 6
    weekday: int = Field(ge=0, le=6)
    shift_id: int | None = Field(default=None, gt=0)
    is_day_off: bool = False


class EmployeeShiftRosterDayCreate(EmployeeShiftRosterDayBase):
    @model_validator(mode="after")
    def validate_shift_assignment(self):
        if self.is_day_off and self.shift_id is not None:
            raise ValueError("A day off cannot have a shift assigned.")

        if not self.is_day_off and self.shift_id is None:
            raise ValueError("A shift is required for a working day.")

        return self


class EmployeeShiftRosterDayResponse(EmployeeShiftRosterDayBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roster_id: int


class EmployeeShiftRosterCreate(BaseModel):
    employee_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    effective_from: date
    effective_to: date | None = None
    notes: str | None = None
    days: list[EmployeeShiftRosterDayCreate] = Field(
        min_length=7,
        max_length=7,
    )

    @model_validator(mode="after")
    def validate_roster(self):
        if (
            self.effective_to is not None
            and self.effective_to < self.effective_from
        ):
            raise ValueError(
                "Effective end date cannot be before the start date."
            )

        weekdays = [day.weekday for day in self.days]

        if len(set(weekdays)) != 7:
            raise ValueError(
                "A roster must contain exactly one entry for each weekday."
            )

        return self


class EmployeeShiftRosterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    effective_from: date | None = None
    effective_to: date | None = None
    is_active: bool | None = None
    notes: str | None = None
    days: list[EmployeeShiftRosterDayCreate] | None = Field(
        default=None,
        min_length=7,
        max_length=7,
    )

    @model_validator(mode="after")
    def validate_roster_update(self):
        if self.days is not None:
            weekdays = [day.weekday for day in self.days]

            if len(set(weekdays)) != 7:
                raise ValueError(
                    "A roster must contain exactly one entry for each weekday."
                )

        if (
            self.effective_from is not None
            and self.effective_to is not None
            and self.effective_to < self.effective_from
        ):
            raise ValueError(
                "Effective end date cannot be before the start date."
            )

        return self


class EmployeeShiftRosterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    employee_id: int
    name: str
    effective_from: date
    effective_to: date | None
    is_active: bool
    notes: str | None
    days: list[EmployeeShiftRosterDayResponse] = []


class EmployeeShiftAssignmentCreate(BaseModel):
    employee_id: int = Field(gt=0)
    work_date: date
    shift_id: int | None = Field(default=None, gt=0)
    is_day_off: bool = False
    reason: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_shift_assignment(self):
        if self.is_day_off and self.shift_id is not None:
            raise ValueError("A day off cannot have a shift assigned.")

        if not self.is_day_off and self.shift_id is None:
            raise ValueError("A shift is required for a working day.")

        return self


class EmployeeShiftAssignmentUpdate(BaseModel):
    work_date: date | None = None
    shift_id: int | None = Field(default=None, gt=0)
    is_day_off: bool | None = None
    reason: str | None = Field(default=None, max_length=2000)


class EmployeeShiftAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    employee_id: int
    work_date: date
    shift_id: int | None
    is_day_off: bool
    reason: str | None
    assigned_by: int | None
    created_at: object
    updated_at: object


class EffectiveEmployeeShiftResponse(BaseModel):
    company_id: int
    employee_id: int
    work_date: date

    scheduled: bool
    is_day_off: bool

    shift_id: int | None = None
    shift_name: str | None = None
    shift_code: str | None = None

    source: str
    reason: str | None = None