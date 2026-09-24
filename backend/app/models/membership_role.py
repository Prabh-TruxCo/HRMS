from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MembershipRole(Base):
    __tablename__ = "membership_roles"

    membership_id: Mapped[int] = mapped_column(
        ForeignKey("company_memberships.id", ondelete="CASCADE"),
        primary_key=True,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )