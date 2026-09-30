from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WorkforceConfiguration(Base):
    __tablename__ = "workforce_configurations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    setup_mode: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="recommended",
    )

    # Attendance
    attendance_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    attendance_methods: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
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

    early_checkout_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    auto_markout_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    attendance_regularization_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    attendance_approval_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Working schedule
    shifts_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Overtime
    overtime_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    overtime_approval_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Remote / field work
    remote_work_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    field_work_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    gps_attendance_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    geofencing_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    company = relationship(
        "Company",
        back_populates="workforce_configuration",
    )
