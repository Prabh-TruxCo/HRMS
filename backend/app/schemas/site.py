from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


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

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius: int | None = Field(default=None, gt=0)
    is_geofence_enabled: bool = False

    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)
    is_active: bool = True

    @model_validator(mode="after")
    def validate_geofence(self):
        if self.is_geofence_enabled:
            if self.latitude is None or self.longitude is None:
                raise ValueError(
                    "Latitude and longitude are required " "when geofencing is enabled."
                )
            if self.geofence_radius is None:
                raise ValueError(
                    "Geofence radius is required " "when geofencing is enabled."
                )
        return self


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

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius: int | None = Field(default=None, gt=0)
    is_geofence_enabled: bool = False

    contact_person: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)
    is_active: bool

    @model_validator(mode="after")
    def validate_geofence(self):
        if self.is_geofence_enabled:
            if self.latitude is None or self.longitude is None:
                raise ValueError(
                    "Latitude and longitude are required " "when geofencing is enabled."
                )
            if self.geofence_radius is None:
                raise ValueError(
                    "Geofence radius is required " "when geofencing is enabled."
                )
        return self


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

    latitude: float | None
    longitude: float | None
    geofence_radius: int | None
    is_geofence_enabled: bool

    contact_person: str | None
    phone: str | None
    email: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SiteListResponse(BaseModel):
    sites: list[SiteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
