from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WorkforceConfiguration(Base):
    __tablename__ = "workforce_configurations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    attendance_mode: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="manual",
    )

    shifts_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    overtime_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    late_marking_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    grace_period_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
    )

    company = relationship(
        "Company",
        back_populates="workforce_configuration",
    )