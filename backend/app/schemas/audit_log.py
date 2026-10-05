from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    account_id: int | None
    company_id: int | None
    user_id: int | None

    user_name: str | None = None

    module: str
    entity_type: str
    entity_id: int
    action: str

    description: str | None

    old_values: dict | None
    new_values: dict | None

    created_at: datetime


class AuditLogListResponse(BaseModel):
    audit_logs: list[AuditLogResponse]