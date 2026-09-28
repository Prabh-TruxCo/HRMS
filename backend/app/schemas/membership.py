from pydantic import BaseModel


class CompanyRoleResponse(BaseModel):
    company_id: int
    role_names: list[str]