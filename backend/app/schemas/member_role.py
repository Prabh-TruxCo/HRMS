from typing import Literal

from pydantic import BaseModel, Field


ScopeCode = Literal[
    "COMPANY",
    "BRANCH",
    "DEPARTMENT",
    "TEAM",
    "ASSIGNED_SITE",
    "SELF",
]


class RoleScopeAssignmentRequest(BaseModel):
    scope: ScopeCode
    scope_entity_ids: list[int] = Field(default_factory=list)


class MemberRoleAssignmentRequest(BaseModel):
    role_id: int
    scope_assignments: list[RoleScopeAssignmentRequest] = Field(
        default_factory=list
    )


class MemberRoleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool


class RoleScopeAssignmentResponse(BaseModel):
    scope: str
    scope_entity_ids: list[int]


class MemberRoleAssignmentResponse(BaseModel):
    role: MemberRoleResponse
    scope_assignments: list[RoleScopeAssignmentResponse]


class MemberRolesResponse(BaseModel):
    membership_id: int
    user_id: int
    company_id: int
    roles: list[MemberRoleAssignmentResponse]


class MemberRolesUpdateRequest(BaseModel):
    roles: list[MemberRoleAssignmentRequest]