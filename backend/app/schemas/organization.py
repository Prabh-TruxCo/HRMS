from pydantic import BaseModel


class OrganizationConfigurationResponse(BaseModel):
    company_id: int
    branches_enabled: bool
    departments_enabled: bool
    teams_enabled: bool
    designations_enabled: bool
    clients_enabled: bool
    sites_enabled: bool
    posts_enabled: bool

    model_config = {"from_attributes": True}


class OrganizationConfigurationUpdateRequest(BaseModel):
    branches_enabled: bool
    departments_enabled: bool
    teams_enabled: bool
    designations_enabled: bool
    clients_enabled: bool
    sites_enabled: bool
    posts_enabled: bool