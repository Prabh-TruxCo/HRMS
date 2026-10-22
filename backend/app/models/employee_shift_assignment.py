
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EmployeeShiftAssignment(Base):
    __tablename__ = "employee_shift_assignments"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "employee_id",
            "work_date",
            name="uq_employee_shift_assignments_company_employee_date",
        ),
        CheckConstraint(
            "(is_day_off = TRUE AND shift_id IS NULL) OR "
            "(is_day_off = FALSE AND shift_id IS NOT NULL)",
            name="ck_employee_shift_assignments_shift_required",
        ),
        Index(
            "ix_employee_shift_assignments_company_date",
            "company_id",
            "work_date",
        ),
        Index(
            "ix_employee_shift_assignments_employee_date",
            "employee_id",
            "work_date",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )

    work_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # Set is_day_off=True to explicitly mark this date as a day off.
    is_day_off: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )

    # Null only when this date is explicitly marked as a day off.
    shift_id: Mapped[int | None] = mapped_column(
        ForeignKey("shifts.id", ondelete="RESTRICT"),
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(Text)

    # User who created the assignment or override.
    assigned_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    company = relationship("Company")
    employee = relationship("Employee")
    shift = relationship("Shift")
    assigned_by_user = relationship("User")
