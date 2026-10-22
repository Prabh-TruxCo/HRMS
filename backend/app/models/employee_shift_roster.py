from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.employee_shift_roster_day import EmployeeShiftRosterDay


class EmployeeShiftRoster(Base):
    __tablename__ = "employee_shift_rosters"

    __table_args__ = (
        Index(
            "ix_employee_shift_rosters_company_employee",
            "company_id",
            "employee_id",
        ),
        Index(
            "ix_employee_shift_rosters_effective_dates",
            "effective_from",
            "effective_to",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    employee = relationship("Employee")
    company = relationship("Company")

    days: Mapped[list["EmployeeShiftRosterDay"]] = relationship(
        "EmployeeShiftRosterDay",
        back_populates="roster",
        cascade="all, delete-orphan",
        order_by="EmployeeShiftRosterDay.weekday",
    )
