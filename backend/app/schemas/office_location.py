
from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class OfficeLocationBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    geofence_enabled: bool = False
    geofence_radius_meters: int | None = Field(
        default=None,
        ge=1,
        le=100000,
    )

    @model_validator(mode="after")
    def validate_location_and_geofence(self) -> Self:
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError(
                "Latitude and longitude must either both be provided or both be empty."
            )

        if self.geofence_enabled:
            if self.latitude is None or self.longitude is None:
                raise ValueError(
                    "Coordinates are required when geofencing is enabled."
                )

            if self.geofence_radius_meters is None:
                raise ValueError(
                    "A geofence radius is required when geofencing is enabled."
                )

        elif self.geofence_radius_meters is not None:
            raise ValueError(
                "Geofence radius must be empty when geofencing is disabled."
            )

        return self


class OfficeLocationCreateRequest(OfficeLocationBase):
    is_active: bool = True


class OfficeLocationUpdateRequest(OfficeLocationBase):
    is_active: bool


class OfficeLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    branch_id: int
    name: str
    code: str | None
    description: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    postal_code: str | None
    latitude: float | None
    longitude: float | None
    geofence_enabled: bool
    geofence_radius_meters: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class OfficeLocationListResponse(BaseModel):
    locations: list[OfficeLocationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
