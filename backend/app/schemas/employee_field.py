
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


EmployeeFieldType = Literal[
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "DATE",
    "EMAIL",
    "PHONE",
    "BOOLEAN",
    "SELECT",
    "MULTISELECT",
]


class EmployeeFieldDefinitionCreateRequest(BaseModel):
    field_key: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=150)
    section: str = Field(
        default="Additional Information",
        min_length=1,
        max_length=100,
    )
    description: str | None = None
    field_type: EmployeeFieldType = "TEXT"
    is_required: bool = False
    is_active: bool = True
    display_order: int = Field(default=0, ge=0)
    options_json: dict[str, Any] | list[Any] | None = None
    validation_json: dict[str, Any] | None = None
    is_searchable: bool = False

    @field_validator("field_key")
    @classmethod
    def normalize_field_key(cls, value: str) -> str:
        value = value.strip().lower()
        if not value:
            raise ValueError("Field key cannot be blank.")
        return value

    @field_validator("label", "section")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


class EmployeeFieldDefinitionUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    section: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    field_type: EmployeeFieldType | None = None
    is_required: bool | None = None
    is_active: bool | None = None
    display_order: int | None = Field(default=None, ge=0)
    options_json: dict[str, Any] | list[Any] | None = None
    validation_json: dict[str, Any] | None = None
    is_searchable: bool | None = None


class EmployeeFieldDefinitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    field_key: str
    label: str
    section: str
    description: str | None
    field_type: str
    is_required: bool
    is_active: bool
    display_order: int
    options_json: dict[str, Any] | list[Any] | None
    validation_json: dict[str, Any] | None
    is_searchable: bool
    created_at: datetime
    updated_at: datetime


class EmployeeFieldDefinitionListResponse(BaseModel):
    fields: list[EmployeeFieldDefinitionResponse]
    total: int
