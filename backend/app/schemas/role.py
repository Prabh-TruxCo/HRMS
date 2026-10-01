from typing import Literal

from pydantic import BaseModel, ConfigDict

ScopeCode = Literal[
    "COMPANY",
    "BRANCH",
    "DEPARTMENT",
    "TEAM",
    "ASSIGNED_SITE",
    "SELF",
]


class RolePermissionResponse(BaseModel):
    id: int
    permission_id: int
    permission_code: str
    permission_name: str
    module: str
    scope: str

    model_config = ConfigDict(from_attributes=True)


class RoleListItem(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None
    is_active: bool
    permissions_count: int
    is_system_role: bool

    model_config = ConfigDict(from_attributes=True)


class RoleDetailResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None
    is_active: bool
    is_system_role: bool
    permissions: list[RolePermissionResponse]

    model_config = ConfigDict(from_attributes=True)


class RoleListResponse(BaseModel):
    roles: list[RoleListItem]


class RoleCreateRequest(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class RoleUpdateRequest(BaseModel):
    name: str
    description: str | None = None
    is_active: bool


class RolePermissionRequest(BaseModel):
    permission_code: str
    scope: ScopeCode


class RolePermissionsUpdateRequest(BaseModel):
    permissions: list[RolePermissionRequest]
