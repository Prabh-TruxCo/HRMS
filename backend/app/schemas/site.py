from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteCreateRequest(BaseModel):
    client_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    site_type: str | None = Field(default=None, max_length=100)
    description: str | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)
    is_active: bool = True


class SiteUpdateRequest(BaseModel):
    client_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    site_type: str | None = Field(default=None, max_length=100)
    description: str | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)
    is_active: bool


class SiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    client_id: int
    name: str
    code: str | None
    site_type: str | None
    description: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    postal_code: str | None
    contact_person: str | None
    phone: str | None
    email: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SiteListResponse(BaseModel):
    sites: list[SiteResponse]
