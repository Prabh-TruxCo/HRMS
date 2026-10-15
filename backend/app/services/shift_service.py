from math import ceil

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.shift import Shift

from datetime import time

from app.schemas.shift import (
    BulkShiftCreateRequest,
    ShiftCreate,
    ShiftUpdate,
)


def get_shifts(
    db: Session,
    company_id: int,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
):
    filters = [Shift.company_id == company_id]

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                Shift.name.ilike(search_term),
                Shift.code.ilike(search_term),
                Shift.description.ilike(search_term),
            )
        )

    if is_active is not None:
        filters.append(Shift.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(Shift).where(*filters)) or 0

    shifts = db.scalars(
        select(Shift)
        .where(*filters)
        .order_by(Shift.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return {
        "shifts": shifts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def get_shift(
    db: Session,
    company_id: int,
    shift_id: int,
) -> Shift | None:
    return db.scalar(
        select(Shift).where(
            Shift.id == shift_id,
            Shift.company_id == company_id,
        )
    )


def create_shift(
    db: Session,
    company_id: int,
    data: ShiftCreate,
) -> Shift:
    shift = Shift(
        company_id=company_id,
        **data.model_dump(),
    )

    db.add(shift)

    try:
        db.commit()
        db.refresh(shift)
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A shift with this name already exists in this company."
        ) from exc

    return shift


def update_shift(
    db: Session,
    company_id: int,
    shift_id: int,
    data: ShiftUpdate,
) -> Shift | None:
    shift = get_shift(db, company_id, shift_id)

    if shift is None:
        return None

    for field, value in data.model_dump().items():
        setattr(shift, field, value)

    try:
        db.commit()
        db.refresh(shift)
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "A shift with this name already exists in this company."
        ) from exc

    return shift


def create_shifts_bulk(
    db: Session,
    company_id: int,
    data: BulkShiftCreateRequest,
) -> list[Shift]:
    first_minutes = data.first_start_time.hour * 60 + data.first_start_time.minute
    last_minutes = data.last_start_time.hour * 60 + data.last_start_time.minute

    generated: list[Shift] = []
    names: list[str] = []

    for start_minutes in range(
        first_minutes,
        last_minutes + 1,
        data.interval_minutes,
    ):
        start_hour, start_minute = divmod(start_minutes, 60)
        start_time = time(
            hour=start_hour,
            minute=start_minute,
        )

        end_minutes = (start_minutes + data.duration_minutes) % 1440
        end_hour, end_minute = divmod(end_minutes, 60)
        end_time = time(
            hour=end_hour,
            minute=end_minute,
        )

        shift_name = f"{data.name_prefix} " f"{start_time.strftime('%H:%M')}"

        names.append(shift_name)
        generated.append(
            Shift(
                company_id=company_id,
                name=shift_name,
                code=None,
                description=None,
                start_time=start_time,
                end_time=end_time,
                break_duration_minutes=(data.break_duration_minutes),
                is_active=data.is_active,
            )
        )

    if not generated:
        raise ValueError("No shifts were generated.")

    normalized_names = [name.casefold() for name in names]

    if len(normalized_names) != len(set(normalized_names)):
        raise ValueError("The batch contains duplicate shift names.")

    existing_names = db.scalars(
        select(Shift.name).where(
            Shift.company_id == company_id,
            func.lower(Shift.name).in_([name.lower() for name in names]),
        )
    ).all()

    if existing_names:
        duplicates = ", ".join(existing_names)
        raise ValueError(f"These shift names already exist: {duplicates}")

    db.add_all(generated)

    try:
        db.commit()

        for shift in generated:
            db.refresh(shift)

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "One or more shifts conflict with existing records. "
            "No shifts from this batch were saved."
        ) from exc

    return generated
