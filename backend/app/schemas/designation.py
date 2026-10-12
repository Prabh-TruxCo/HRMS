
from pydantic import BaseModel, ConfigDict


class DesignationBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    is_active: bool = True


class DesignationCreate(DesignationBase):
    pass


class DesignationUpdate(DesignationBase):
    pass


class DesignationResponse(DesignationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DesignationListResponse(BaseModel):
    designations: list[DesignationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
