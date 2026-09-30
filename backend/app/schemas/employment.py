from pydantic import BaseModel, Field


class EmploymentTypeCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class EmploymentTypeUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool


class EmploymentTypeResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}
