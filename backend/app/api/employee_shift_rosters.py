from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.organization_access import (
    validate_organization_module_access,
)
from app.db.session import get_db
from app.schemas.employee_shift_roster import (
    EmployeeShiftRosterCreate,
    EmployeeShiftRosterResponse,
    EmployeeShiftAssignmentCreate,
    EmployeeShiftAssignmentResponse,
    EmployeeShiftAssignmentUpdate,
    EffectiveEmployeeShiftResponse,
)
from app.services.employee_shift_roster_service import (
    EmployeeShiftRosterService,
)

router = APIRouter(
    prefix="/companies/{company_id}/shift-rosters",
    tags=["Employee Shift Rosters"],
)


def _validate_access(
    db: Session,
    company_id: int,
    current_user,
) -> None:
    validate_organization_module_access(
        db=db,
        company_id=company_id,
        current_user=current_user,
        module="employees_enabled",
    )


# --------------------------------------------------
# WEEKLY SHIFT ROSTERS
# --------------------------------------------------


@router.post(
    "",
    response_model=EmployeeShiftRosterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shift_roster(
    company_id: int,
    payload: EmployeeShiftRosterCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).create_roster(
        company_id=company_id,
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "",
    response_model=list[EmployeeShiftRosterResponse],
)
def list_shift_rosters(
    company_id: int,
    employee_id: int | None = Query(None, ge=1),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).list_rosters(
        company_id=company_id,
        employee_id=employee_id,
        is_active=is_active,
    )


# --------------------------------------------------
# DATE-SPECIFIC SHIFT ASSIGNMENTS / OVERRIDES
# --------------------------------------------------


@router.post(
    "/assignments",
    response_model=EmployeeShiftAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shift_assignment(
    company_id: int,
    payload: EmployeeShiftAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).create_assignment(
        company_id=company_id,
        current_user=current_user,
        payload=payload,
    )


@router.get(
    "/assignments",
    response_model=list[EmployeeShiftAssignmentResponse],
)
def list_shift_assignments(
    company_id: int,
    start_date: date,
    end_date: date,
    employee_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).list_assignments(
        company_id=company_id,
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
    )


@router.patch(
    "/assignments/{assignment_id}",
    response_model=EmployeeShiftAssignmentResponse,
)
def update_shift_assignment(
    company_id: int,
    assignment_id: int,
    payload: EmployeeShiftAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).update_assignment(
        company_id=company_id,
        assignment_id=assignment_id,
        current_user=current_user,
        payload=payload,
    )


# --------------------------------------------------
# GET A SINGLE WEEKLY ROSTER
# Keep this dynamic route after /assignments.
# --------------------------------------------------


@router.get(
    "/{roster_id}",
    response_model=EmployeeShiftRosterResponse,
)
def get_shift_roster(
    company_id: int,
    roster_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeShiftRosterService(db).get_roster(
        company_id=company_id,
        roster_id=roster_id,
    )


@router.get(
    "/effective",
    response_model=EffectiveEmployeeShiftResponse,
)
def get_effective_employee_shift(
    company_id: int,
    employee_id: int = Query(..., gt=0),
    work_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    service = EmployeeShiftRosterService(db)

    return service.resolve_effective_shift(
        company_id=company_id,
        employee_id=employee_id,
        work_date=work_date,
    )
