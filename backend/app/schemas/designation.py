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