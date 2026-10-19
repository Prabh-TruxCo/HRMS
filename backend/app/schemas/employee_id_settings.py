
from pydantic import BaseModel, Field, ConfigDict


class EmployeeIdSettingsUpdate(BaseModel):
    prefix: str = Field(min_length=1, max_length=30)
    next_number: int = Field(ge=1)
    number_padding: int = Field(ge=1, le=12)


class EmployeeIdSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_id: int
    prefix: str
    next_number: int
    number_padding: int
