from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RolePermissionScopeAssignment(Base):
    __tablename__ = "role_permission_scope_assignments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    membership_id: Mapped[int] = mapped_column(
        ForeignKey(
            "company_memberships.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey(
            "roles.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    scope: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    scope_entity_id: Mapped[int] = mapped_column(
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "membership_id",
            "role_id",
            "scope",
            "scope_entity_id",
            name="uq_member_role_scope_entity",
        ),
    )
