from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log import AuditLogResponse


class AuditLogService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = AuditLogRepository(db)

    # ---------------------------------------------------------
    # CREATE AUDIT LOG
    # ---------------------------------------------------------

    def log(
        self,
        *,
        user_id: int | None,
        account_id: int | None,
        company_id: int | None,
        module: str,
        entity_type: str,
        entity_id: int,
        action: str,
        description: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
    ) -> AuditLog:

        audit_log = AuditLog(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module=module.upper(),
            entity_type=entity_type.upper(),
            entity_id=entity_id,
            action=action.upper(),
            description=description,
            old_values=old_values,
            new_values=new_values,
        )

        return self.repository.create(audit_log)

    # ---------------------------------------------------------
    # USER DISPLAY NAME
    # ---------------------------------------------------------

    def _user_name(self, user) -> str | None:
        if user is None:
            return None

        first_name = getattr(user, "first_name", None)
        last_name = getattr(user, "last_name", None)

        full_name = " ".join(
            filter(
                None,
                [first_name, last_name],
            )
        ).strip()

        if full_name:
            return full_name

        return (
            getattr(user, "name", None)
            or getattr(user, "username", None)
            or getattr(user, "email", None)
        )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    def _build_response(self, log: AuditLog) -> AuditLogResponse:
        user_name = None

        if log.user_id is not None:
            # User relationship is intentionally not required
            # for creating an audit record.
            user = getattr(log, "user", None)
            user_name = self._user_name(user)

        return AuditLogResponse(
            id=log.id,
            account_id=log.account_id,
            company_id=log.company_id,
            user_id=log.user_id,
            user_name=user_name,
            module=log.module,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            action=log.action,
            description=log.description,
            old_values=log.old_values,
            new_values=log.new_values,
            created_at=log.created_at,
        )

    # ---------------------------------------------------------
    # ENTITY LOGS
    # ---------------------------------------------------------

    def get_entity_logs(
        self,
        company_id: int,
        entity_type: str,
        entity_id: int,
    ) -> list[AuditLogResponse]:

        logs = self.repository.get_by_entity(
            company_id=company_id,
            entity_type=entity_type.upper(),
            entity_id=entity_id,
        )

        return [
            self._build_response(log)
            for log in logs
        ]

    # ---------------------------------------------------------
    # COMPANY + ENTITY TYPE
    # ---------------------------------------------------------

    def get_company_entity_logs(
        self,
        company_id: int,
        entity_type: str,
    ) -> list[AuditLogResponse]:

        logs = self.repository.get_by_company_and_entity_type(
            company_id=company_id,
            entity_type=entity_type.upper(),
        )

        return [
            self._build_response(log)
            for log in logs
        ]

    # ---------------------------------------------------------
    # ALL COMPANY LOGS
    # ---------------------------------------------------------

    def get_company_logs(
        self,
        company_id: int,
    ) -> list[AuditLogResponse]:

        logs = self.repository.get_by_company(
            company_id=company_id,
        )

        return [
            self._build_response(log)
            for log in logs
        ]