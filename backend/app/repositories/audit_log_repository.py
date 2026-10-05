from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, audit_log: AuditLog) -> AuditLog:
        self.db.add(audit_log)
        self.db.flush()
        self.db.refresh(audit_log)

        return audit_log

    def get_by_entity(
        self,
        company_id: int,
        entity_type: str,
        entity_id: int,
    ) -> list[AuditLog]:
        statement = (
            select(AuditLog)
            .where(
                AuditLog.company_id == company_id,
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.created_at.desc())
        )

        return list(self.db.scalars(statement).all())

    def get_by_company_and_entity_type(
        self,
        company_id: int,
        entity_type: str,
    ) -> list[AuditLog]:
        statement = (
            select(AuditLog)
            .where(
                AuditLog.company_id == company_id,
                AuditLog.entity_type == entity_type,
            )
            .order_by(AuditLog.created_at.desc())
        )

        return list(self.db.scalars(statement).all())

    def get_by_company(
        self,
        company_id: int,
    ) -> list[AuditLog]:
        statement = (
            select(AuditLog)
            .where(
                AuditLog.company_id == company_id,
            )
            .order_by(AuditLog.created_at.desc())
        )

        return list(self.db.scalars(statement).all())