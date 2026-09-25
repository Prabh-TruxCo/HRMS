from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    account_name: str = Field(
        min_length=1,
        max_length=200,
    )

    company_name: str = Field(
        min_length=1,
        max_length=200,
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


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    account_id: int
    company_id: int
    access_token: str