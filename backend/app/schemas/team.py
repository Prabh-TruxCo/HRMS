from pydantic import BaseModel, ConfigDict


class TeamBase(BaseModel):
    department_id: int
    name: str
    code: str | None = None
    description: str | None = None
    is_active: bool = True


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamBase):
    pass


class TeamResponse(TeamBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
