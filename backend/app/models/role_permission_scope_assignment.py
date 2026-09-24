from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RolePermissionScopeAssignment(Base):
    __tablename__ = "role_permission_scope_assignments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    role_permission_id: Mapped[int] = mapped_column(
        ForeignKey(
            "role_permissions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    scope_entity_id: Mapped[int] = mapped_column(
        nullable=False,
    )