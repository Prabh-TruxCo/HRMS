from pydantic import BaseModel, ConfigDict


class ClientCreateRequest(BaseModel):
    name: str
    code: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "India"
    description: str | None = None
    is_active: bool = True


class ClientUpdateRequest(BaseModel):
    name: str
    code: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "India"
    description: str | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None
    contact_person: str | None
    phone: str | None
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    description: str | None
    is_active: bool


class ClientListResponse(BaseModel):
    clients: list[ClientResponse]
