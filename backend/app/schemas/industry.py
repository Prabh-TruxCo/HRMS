from pydantic import BaseModel, ConfigDict


class IndustryResponse(BaseModel):
    id: int
    code: str
    name: str
    description: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)