from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    # Tenant/account context
    account_id: Mapped[int | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Company context.
    # Nullable because some future platform-level actions
    # may not belong to a specific company.
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # User who performed the action.
    # Keep nullable so system/platform actions can be supported later.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Broad application area.
    # Examples:
    # ORGANIZATION
    # WORKFORCE
    # ATTENDANCE
    # LEAVE
    # PAYROLL
    # AUTHENTICATION
    module: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    # Object that was affected.
    # Examples:
    # COMPANY
    # BRANCH
    # DEPARTMENT
    # TEAM
    # USER
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    # ID of the affected object.
    #
    # Integer for now because all current HRMS entities use
    # integer primary keys.
    entity_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    # Examples:
    # CREATED
    # UPDATED
    # DELETED
    # ENABLED
    # DISABLED
    # LOGIN
    # LOGOUT
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # State before the change.
    old_values: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # State after the change.
    new_values: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="audit_logs",
    )
