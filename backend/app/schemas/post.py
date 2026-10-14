from pydantic import BaseModel, ConfigDict, Field


class PostCreateRequest(BaseModel):
    site_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = None

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius: int | None = Field(default=None, gt=0)
    is_geofence_enabled: bool = False

    is_active: bool = True


class PostUpdateRequest(BaseModel):
    site_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(default=None, max_length=50)
    description: str | None = None

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    geofence_radius: int | None = Field(default=None, gt=0)
    is_geofence_enabled: bool = False

    is_active: bool


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    site_id: int
    name: str
    code: str | None
    description: str | None

    latitude: float | None
    longitude: float | None
    geofence_radius: int | None
    is_geofence_enabled: bool

    is_active: bool
    created_at: object
    updated_at: object


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
