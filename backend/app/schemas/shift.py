from datetime import time

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


class ShiftCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=2000)

    start_time: time
    end_time: time

    break_duration_minutes: int = Field(default=0, ge=0, le=1440)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Shift name cannot be empty.")

        return value

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_shift_times(self):
        start_minutes = self.start_time.hour * 60 + self.start_time.minute
        end_minutes = self.end_time.hour * 60 + self.end_time.minute

        # Supports overnight shifts, e.g. 22:00 to 06:00.
        duration_minutes = (end_minutes - start_minutes) % 1440

        if duration_minutes == 0:
            raise ValueError("Start and end times cannot be the same.")

        if self.break_duration_minutes >= duration_minutes:
            raise ValueError("Break duration must be shorter than the shift duration.")

        return self


class ShiftUpdate(ShiftCreate):
    pass


class ShiftResponse(BaseModel):
    id: int
    company_id: int
    name: str
    code: str | None
    description: str | None
    start_time: time
    end_time: time
    break_duration_minutes: int
    is_active: bool

    model_config = {"from_attributes": True}


class ShiftListResponse(BaseModel):
    shifts: list[ShiftResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BulkShiftCreateRequest(BaseModel):
    name_prefix: str = Field(min_length=1, max_length=70)
    first_start_time: time
    last_start_time: time
    interval_minutes: int = Field(ge=1, le=720)
    duration_minutes: int = Field(ge=1, le=1440)
    break_duration_minutes: int = Field(default=0, ge=0, le=1440)
    is_active: bool = True

    @field_validator("name_prefix")
    @classmethod
    def validate_name_prefix(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Shift name prefix cannot be empty.")

        return value

    @model_validator(mode="after")
    def validate_bulk_settings(self):
        first = self.first_start_time.hour * 60 + self.first_start_time.minute
        last = self.last_start_time.hour * 60 + self.last_start_time.minute

        if self.first_start_time.second or self.last_start_time.second:
            raise ValueError("Shift start times must use whole minutes.")

        if last < first:
            raise ValueError("Last start time must be at or after first start time.")

        if (last - first) // self.interval_minutes + 1 > 100:
            raise ValueError("A batch cannot contain more than 100 shifts.")

        if self.break_duration_minutes >= self.duration_minutes:
            raise ValueError("Break duration must be shorter than shift duration.")

        return self


class BulkShiftCreateResponse(BaseModel):
    created_count: int
    shifts: list[ShiftResponse]
