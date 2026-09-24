from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey("accounts.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    legal_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    industry_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    employee_size: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="India",
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Asia/Kolkata",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )