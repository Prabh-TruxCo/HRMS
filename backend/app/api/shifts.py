from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.shift_access import validate_shift_access
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User

from app.schemas.shift import (
    BulkShiftCreateRequest,
    BulkShiftCreateResponse,
    ShiftCreate,
    ShiftListResponse,
    ShiftResponse,
    ShiftUpdate,
)

from app.services.company_service import get_company_for_user

from app.services.shift_service import (
    create_shift,
    create_shifts_bulk,
    get_shift,
    get_shifts,
    update_shift,
)

router = APIRouter(
    prefix="/companies",
    tags=["Shifts"],
)


def _validate_company_shift_access(
    db: Session,
    company_id: int,
    current_user: User,
) -> Company:
    company: Company = get_company_for_user(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
    )

    validate_shift_access(
        db=db,
        company_id=company.id,
    )

    return company


@router.get(
    "/{company_id}/shifts",
    response_model=ShiftListResponse,
)
def list_shifts(
    company_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = _validate_company_shift_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
    )

    return get_shifts(
        db=db,
        company_id=company.id,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
    )


@router.get(
    "/{company_id}/shifts/{shift_id}",
    response_model=ShiftResponse,
)
def read_shift(
    company_id: int,
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = _validate_company_shift_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
    )

    shift = get_shift(
        db=db,
        company_id=company.id,
        shift_id=shift_id,
    )

    if shift is None:
        raise HTTPException(
            status_code=404,
            detail="Shift not found.",
        )

    return shift


@router.post(
    "/{company_id}/shifts",
    response_model=ShiftResponse,
    status_code=201,
)
def add_shift(
    company_id: int,
    data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = _validate_company_shift_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
    )

    try:
        return create_shift(
            db=db,
            company_id=company.id,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.put(
    "/{company_id}/shifts/{shift_id}",
    response_model=ShiftResponse,
)
def edit_shift(
    company_id: int,
    shift_id: int,
    data: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = _validate_company_shift_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
    )

    try:
        shift = update_shift(
            db=db,
            company_id=company.id,
            shift_id=shift_id,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    if shift is None:
        raise HTTPException(
            status_code=404,
            detail="Shift not found.",
        )

    return shift


@router.post(
    "/{company_id}/shifts/bulk",
    response_model=BulkShiftCreateResponse,
    status_code=201,
)
def add_shifts_bulk(
    company_id: int,
    data: BulkShiftCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = _validate_company_shift_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
    )

    try:
        shifts = create_shifts_bulk(
            db=db,
            company_id=company.id,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return {
        "created_count": len(shifts),
        "shifts": shifts,
    }
