from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.organization_access import validate_organization_module_access
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdateRequest,
)
from app.services.employee_service import EmployeeService

from app.schemas.employee_field import (
    EmployeeFieldDefinitionCreateRequest,
    EmployeeFieldDefinitionUpdateRequest,
    EmployeeFieldDefinitionResponse,
    EmployeeFieldDefinitionListResponse,
)
from app.services.employee_field_service import EmployeeFieldService

router = APIRouter(
    prefix="/companies/{company_id}/employees",
    tags=["Employees"],
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


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    company_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    department_id: int | None = Query(None, ge=1),
    branch_id: int | None = Query(None, ge=1),
    team_id: int | None = Query(None, ge=1),
    employment_status: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeService.list_employees(
        db=db,
        company_id=company_id,
        page=page,
        page_size=page_size,
        search=search,
        department_id=department_id,
        branch_id=branch_id,
        team_id=team_id,
        employment_status=employment_status,
        is_active=is_active,
    )


@router.get(
    "/field-definitions",
    response_model=EmployeeFieldDefinitionListResponse,
)
def list_employee_field_definitions(
    company_id: int,
    include_inactive: bool = Query(True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeFieldService.list_fields(
        db=db,
        company_id=company_id,
        include_inactive=include_inactive,
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    company_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeService.get_employee(
        db=db,
        company_id=company_id,
        employee_id=employee_id,
    )


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    company_id: int,
    payload: EmployeeCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeService.create_employee(
        db=db,
        company_id=company_id,
        data=payload.model_dump(exclude_unset=True),
        current_user=current_user,
    )


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    company_id: int,
    employee_id: int,
    payload: EmployeeUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeService.update_employee(
        db=db,
        company_id=company_id,
        employee_id=employee_id,
        data=payload.model_dump(exclude_unset=True),
        current_user=current_user,
    )


@router.post(
    "/field-definitions",
    response_model=EmployeeFieldDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_field_definition(
    company_id: int,
    payload: EmployeeFieldDefinitionCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeFieldService.create_field(
        db=db,
        company_id=company_id,
        data=payload.model_dump(),
        current_user=current_user,
    )


@router.patch(
    "/field-definitions/{field_id}",
    response_model=EmployeeFieldDefinitionResponse,
)
def update_employee_field_definition(
    company_id: int,
    field_id: int,
    payload: EmployeeFieldDefinitionUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _validate_access(db, company_id, current_user)

    return EmployeeFieldService.update_field(
        db=db,
        company_id=company_id,
        field_id=field_id,
        data=payload.model_dump(exclude_unset=True),
        current_user=current_user,
    )
