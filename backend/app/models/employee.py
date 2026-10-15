from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Employee(Base):
    __tablename__ = "employees"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "employee_code",
            name="uq_employees_company_employee_code",
        ),
        UniqueConstraint(
            "company_id",
            "user_id",
            name="uq_employees_company_user",
        ),
        Index("ix_employees_company_name", "company_id", "first_name", "last_name"),
        Index("ix_employees_company_status", "company_id", "employment_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    display_name: Mapped[str | None] = mapped_column(String(200))

    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(30))
    personal_email: Mapped[str | None] = mapped_column(String(255))
    work_email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(30))
    alternate_phone: Mapped[str | None] = mapped_column(String(30))

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        index=True,
    )
    designation_id: Mapped[int | None] = mapped_column(
        ForeignKey("designations.id", ondelete="SET NULL"),
        index=True,
    )
    team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"),
        index=True,
    )
    branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("branches.id", ondelete="SET NULL"),
        index=True,
    )
    site_id: Mapped[int | None] = mapped_column(
        ForeignKey("sites.id", ondelete="SET NULL"),
        index=True,
    )
    employment_type_id: Mapped[int | None] = mapped_column(
        ForeignKey("employment_types.id", ondelete="SET NULL"),
        index=True,
    )
    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        index=True,
    )

    joining_date: Mapped[date | None] = mapped_column(Date)
    probation_end_date: Mapped[date | None] = mapped_column(Date)
    confirmation_date: Mapped[date | None] = mapped_column(Date)
    employment_end_date: Mapped[date | None] = mapped_column(Date)

    employment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="DRAFT"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    height_cm: Mapped[Any | None] = mapped_column(Numeric(6, 2))
    weight_kg: Mapped[Any | None] = mapped_column(Numeric(6, 2))
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

    manager: Mapped["Employee | None"] = relationship(
        "Employee",
        remote_side="Employee.id",
        foreign_keys=[manager_id],
        back_populates="direct_reports",
    )
    direct_reports: Mapped[list["Employee"]] = relationship(
        "Employee",
        foreign_keys=[manager_id],
        back_populates="manager",
    )
    custom_field_values: Mapped[list["EmployeeFieldValue"]] = relationship(
        "EmployeeFieldValue",
        back_populates="employee",
        cascade="all, delete-orphan",
    )


class EmployeeIdSequence(Base):
    __tablename__ = "employee_id_sequences"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            name="uq_employee_id_sequences_company",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )
    prefix: Mapped[str] = mapped_column(String(30), nullable=False, default="EMP")
    next_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    number_padding: Mapped[int] = mapped_column(Integer, nullable=False, default=4)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class EmployeeFieldDefinition(Base):
    __tablename__ = "employee_field_definitions"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "field_key",
            name="uq_employee_field_definitions_company_key",
        ),
        Index(
            "ix_employee_field_definitions_company_active",
            "company_id",
            "is_active",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    field_key: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    section: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Additional Information"
    )
    description: Mapped[str | None] = mapped_column(Text)
    field_type: Mapped[str] = mapped_column(String(30), nullable=False, default="TEXT")
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    options_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSON)
    validation_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    is_searchable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    field_values: Mapped[list["EmployeeFieldValue"]] = relationship(
        "EmployeeFieldValue",
        back_populates="field_definition",
        cascade="all, delete-orphan",
    )


class EmployeeFieldValue(Base):
    __tablename__ = "employee_field_values"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "field_definition_id",
            name="uq_employee_field_values_employee_field",
        ),
        Index("ix_employee_field_values_definition", "field_definition_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    field_definition_id: Mapped[int] = mapped_column(
        ForeignKey("employee_field_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    value: Mapped[Any | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    employee: Mapped["Employee"] = relationship(
        "Employee", back_populates="custom_field_values"
    )
    field_definition: Mapped["EmployeeFieldDefinition"] = relationship(
        "EmployeeFieldDefinition", back_populates="field_values"
    )
