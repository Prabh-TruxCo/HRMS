
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EmployeeShiftRosterDay(Base):
    __tablename__ = "employee_shift_roster_days"

    __table_args__ = (
        UniqueConstraint(
            "roster_id",
            "weekday",
            name="uq_employee_shift_roster_days_roster_weekday",
        ),
        CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="ck_employee_shift_roster_days_weekday",
        ),
        CheckConstraint(
            "(is_day_off = TRUE AND shift_id IS NULL) OR "
            "(is_day_off = FALSE AND shift_id IS NOT NULL)",
            name="ck_employee_shift_roster_days_shift_required",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    roster_id: Mapped[int] = mapped_column(
        ForeignKey(
            "employee_shift_rosters.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # Monday = 0, Tuesday = 1, ..., Sunday = 6
    weekday: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Weekly off days do not have a shift.
    is_day_off: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    shift_id: Mapped[int | None] = mapped_column(
        ForeignKey("shifts.id", ondelete="RESTRICT"),
        nullable=True,
    )

    roster = relationship(
        "EmployeeShiftRoster",
        back_populates="days",
    )

    shift = relationship("Shift")
