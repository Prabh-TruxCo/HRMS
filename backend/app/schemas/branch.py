from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BranchCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    is_active: bool = True


class BranchUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    is_active: bool


class BranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    name: str
    code: str | None
    description: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BranchListResponse(BaseModel):
    branches: list[BranchResponse]