from pydantic import BaseModel, Field


class CompanyCreateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200,
    )

    code: str = Field(
        min_length=2,
        max_length=10,
        pattern=r"^[A-Za-z0-9]+$",
    )

    industry_type: str = Field(
        min_length=1,
        max_length=100,
    )

    employee_size: str | None = Field(
        default=None,
        max_length=50,
    )

    country: str = Field(
        default="India",
        max_length=100,
    )
    
    color: str | None = Field(
        default=None,
        max_length=20,
    )


class CompanyBulkCreateRequest(BaseModel):
    companies: list[CompanyCreateRequest] = Field(
        min_length=1,
        max_length=50,
    )


class CompanyResponse(BaseModel):
    id: int
    account_id: int
    name: str
    code: str
    industry_type: str
    employee_size: str | None
    country: str
    is_active: bool

    model_config = {
        "from_attributes": True,
    }


class CompanyBulkCreateResponse(BaseModel):
    companies: list[CompanyResponse]


class CompanyListItem(BaseModel):
    id: int
    name: str
    code: str
    industry_type: str
    employee_size: str | None
    country: str
    color: str | None
    logo: str | None
    is_active: bool

    model_config = {
        "from_attributes": True,
    }


class MyCompaniesResponse(BaseModel):
    companies: list[CompanyListItem]


class CompanyUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    legal_name: str | None = Field(default=None, max_length=200)
    industry_type: str = Field(min_length=1, max_length=100)
    employee_size: str | None = Field(default=None, max_length=50)
    country: str = Field(default="India", max_length=100)
    timezone: str = Field(default="Asia/Kolkata", max_length=100)
    color: str | None = Field(default=None, max_length=20)
    logo: str | None = Field(default=None, max_length=500)


class CompanyDetailResponse(BaseModel):
    id: int
    account_id: int
    name: str
    legal_name: str | None
    code: str
    industry_type: str
    employee_size: str | None
    country: str
    timezone: str
    color: str | None
    logo: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class CompanySetupStatusResponse(BaseModel):
    profile: bool
    branding: bool
    organization: bool
    workforce: bool
    completed_sections: int
    total_sections: int
    percentage: int

