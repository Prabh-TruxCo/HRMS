from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.employee import (
    Employee,
    EmployeeFieldDefinition,
    EmployeeFieldValue,
    EmployeeIdSequence,
)
from app.services.audit_log_service import AuditLogService


class EmployeeService:
    MODULE = "EMPLOYEES"
    ENTITY = "EMPLOYEE"

    LINKED_MODELS = {
        "department_id": "department",
        "designation_id": "designation",
        "team_id": "team",
        "branch_id": "branch",
        "site_id": "site",
        "employment_type_id": "employment_type",
    }

    @staticmethod
    def _not_found() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in this company.",
        )

    @staticmethod
    def _get_company(db: Session, company_id: int) -> Company:
        company = db.get(Company, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found.",
            )
        return company

    @staticmethod
    def _get_account_id(db: Session, company_id: int) -> int:
        company = db.get(Company, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found.",
            )
        return company.account_id

    @staticmethod
    def _get_employee(
        db: Session,
        company_id: int,
        employee_id: int,
    ) -> Employee:
        employee = db.scalar(
            select(Employee).where(
                Employee.id == employee_id,
                Employee.company_id == company_id,
            )
        )
        if not employee:
            raise EmployeeService._not_found()
        return employee

    @staticmethod
    def _employee_snapshot(employee: Employee) -> dict[str, Any]:
        fields = (
            "employee_code",
            "first_name",
            "middle_name",
            "last_name",
            "display_name",
            "date_of_birth",
            "gender",
            "personal_email",
            "work_email",
            "phone",
            "department_id",
            "designation_id",
            "team_id",
            "branch_id",
            "site_id",
            "employment_type_id",
            "manager_id",
            "joining_date",
            "probation_end_date",
            "confirmation_date",
            "employment_end_date",
            "employment_status",
            "is_active",
            "height_cm",
            "weight_kg",
            "notes",
        )
        return {
            field: (
                getattr(employee, field).isoformat()
                if isinstance(getattr(employee, field), date)
                else getattr(employee, field)
            )
            for field in fields
        }

    @staticmethod
    def _generate_employee_code(
        db: Session,
        company_id: int,
    ) -> str:
        sequence = db.scalar(
            select(EmployeeIdSequence)
            .where(EmployeeIdSequence.company_id == company_id)
            .with_for_update()
        )

        if sequence is None:
            sequence = EmployeeIdSequence(
                company_id=company_id,
                prefix="EMP",
                next_number=1,
                number_padding=4,
            )
            db.add(sequence)
            db.flush()

            # Lock the newly created sequence row.
            sequence = db.scalar(
                select(EmployeeIdSequence)
                .where(EmployeeIdSequence.company_id == company_id)
                .with_for_update()
            )

        number = sequence.next_number
        sequence.next_number = number + 1

        return f"{sequence.prefix}" f"{number:0{sequence.number_padding}d}"

    @staticmethod
    def _validate_linked_records(
        db: Session,
        company_id: int,
        data: dict[str, Any],
        current_employee_id: int | None = None,
    ) -> None:
        from app.models.branch import Branch
        from app.models.department import Department
        from app.models.designation import Designation
        from app.models.employment_type import EmploymentType
        from app.models.site import Site
        from app.models.team import Team

        model_map = {
            "department_id": Department,
            "designation_id": Designation,
            "team_id": Team,
            "branch_id": Branch,
            "site_id": Site,
            "employment_type_id": EmploymentType,
        }

        for field, model in model_map.items():
            record_id = data.get(field)
            if record_id is None:
                continue

            record = db.get(model, record_id)
            if record is None or getattr(record, "company_id", None) != company_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid {field}: record does not belong to this company.",
                )

        manager_id = data.get("manager_id")
        if manager_id is not None:
            if current_employee_id is not None and manager_id == current_employee_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="An employee cannot be their own manager.",
                )

            manager = db.scalar(
                select(Employee).where(
                    Employee.id == manager_id,
                    Employee.company_id == company_id,
                )
            )
            if manager is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Manager must belong to the same company.",
                )

            # Prevent a reporting cycle.
            visited: set[int] = set()
            current = manager
            while current is not None:
                if current.id == current_employee_id:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="This manager assignment would create a reporting cycle.",
                    )
                if current.id in visited:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="The existing reporting hierarchy contains a cycle.",
                    )
                visited.add(current.id)
                current = (
                    db.get(Employee, current.manager_id)
                    if current.manager_id is not None
                    else None
                )

    @staticmethod
    def _save_custom_fields(
        db: Session,
        company_id: int,
        employee: Employee,
        custom_fields: dict[str, Any],
    ) -> None:
        if not custom_fields:
            return

        definitions = db.scalars(
            select(EmployeeFieldDefinition).where(
                EmployeeFieldDefinition.company_id == company_id,
                EmployeeFieldDefinition.is_active.is_(True),
            )
        ).all()

        definitions_by_key = {
            definition.field_key: definition for definition in definitions
        }

        for field_key, value in custom_fields.items():
            definition = definitions_by_key.get(field_key)
            if definition is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown or inactive employee custom field: {field_key}.",
                )

            if definition.is_required and value is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"{definition.label} is required.",
                )

            existing = db.scalar(
                select(EmployeeFieldValue).where(
                    EmployeeFieldValue.employee_id == employee.id,
                    EmployeeFieldValue.field_definition_id == definition.id,
                )
            )

            if existing:
                existing.value = value
            else:
                db.add(
                    EmployeeFieldValue(
                        employee_id=employee.id,
                        field_definition_id=definition.id,
                        value=value,
                    )
                )

    @staticmethod
    def _log(
        db: Session,
        user_id: int,
        account_id: int,
        company_id: int,
        employee: Employee,
        action: str,
        description: str,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
    ) -> None:
        AuditLogService(db).log(
            user_id=user_id,
            account_id=account_id,
            company_id=company_id,
            module=EmployeeService.MODULE,
            entity_type=EmployeeService.ENTITY,
            entity_id=employee.id,
            action=action,
            description=description,
            old_values=old_values,
            new_values=new_values,
        )

    @staticmethod
    def list_employees(
        db: Session,
        company_id: int,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        department_id: int | None = None,
        branch_id: int | None = None,
        team_id: int | None = None,
        employment_status: str | None = None,
        is_active: bool | None = None,
    ) -> dict[str, Any]:
        if page < 1:
            raise HTTPException(
                status_code=422,
                detail="Page must be at least 1.",
            )
        if not 1 <= page_size <= 100:
            raise HTTPException(
                status_code=422,
                detail="Page size must be between 1 and 100.",
            )

        EmployeeService._get_company(db, company_id)

        query = select(Employee).where(Employee.company_id == company_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Employee.employee_code.ilike(term),
                    Employee.first_name.ilike(term),
                    Employee.middle_name.ilike(term),
                    Employee.last_name.ilike(term),
                    Employee.display_name.ilike(term),
                    Employee.personal_email.ilike(term),
                    Employee.work_email.ilike(term),
                    Employee.phone.ilike(term),
                )
            )

        if department_id is not None:
            query = query.where(Employee.department_id == department_id)
        if branch_id is not None:
            query = query.where(Employee.branch_id == branch_id)
        if team_id is not None:
            query = query.where(Employee.team_id == team_id)
        if employment_status is not None:
            query = query.where(Employee.employment_status == employment_status)
        if is_active is not None:
            query = query.where(Employee.is_active.is_(is_active))

        count_query = select(func.count()).select_from(query.order_by(None).subquery())
        total = db.scalar(count_query) or 0

        employees = db.scalars(
            query.order_by(Employee.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()

        return {
            "employees": employees,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }

    @staticmethod
    def get_employee(
        db: Session,
        company_id: int,
        employee_id: int,
    ) -> Employee:
        EmployeeService._get_company(db, company_id)
        return EmployeeService._get_employee(db, company_id, employee_id)

    @staticmethod
    def create_employee(
        db: Session,
        company_id: int,
        data: dict[str, Any],
        current_user,
    ) -> Employee:
        try:
            company = EmployeeService._get_company(db, company_id)

            payload = dict(data)
            custom_fields = payload.pop("custom_fields", {}) or {}
            supplied_code = payload.get("employee_code")

            if supplied_code is not None:
                supplied_code = supplied_code.strip()
                if not supplied_code:
                    raise HTTPException(
                        status_code=422,
                        detail="Employee code cannot be blank.",
                    )
                payload["employee_code"] = supplied_code
            else:
                payload["employee_code"] = EmployeeService._generate_employee_code(
                    db, company_id
                )

            EmployeeService._validate_linked_records(db, company_id, payload)

            if payload.get("user_id") is not None:
                from app.models.user import User

                user = db.get(User, payload["user_id"])
                if user is None or not user.is_active:
                    raise HTTPException(
                        status_code=422,
                        detail="Linked login user does not exist or is inactive.",
                    )

            duplicate = db.scalar(
                select(Employee.id).where(
                    Employee.company_id == company_id,
                    Employee.employee_code == payload["employee_code"],
                )
            )
            if duplicate is not None:
                raise HTTPException(
                    status_code=409,
                    detail="Employee code already exists in this company.",
                )

            employee = Employee(
                company_id=company_id,
                **payload,
            )
            db.add(employee)
            db.flush()

            EmployeeService._save_custom_fields(db, company_id, employee, custom_fields)

            EmployeeService._log(
                db=db,
                user_id=current_user.id,
                account_id=company.account_id,
                company_id=company_id,
                employee=employee,
                action="CREATED",
                description=f"Created employee {employee.employee_code}.",
                new_values=EmployeeService._employee_snapshot(employee),
            )

            db.commit()
            db.refresh(employee)
            return employee

        except HTTPException:
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Employee code or linked login user already exists in this company.",
            ) from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_employee(
        db: Session,
        company_id: int,
        employee_id: int,
        data: dict[str, Any],
        current_user,
    ) -> Employee:
        try:
            company = EmployeeService._get_company(db, company_id)
            employee = EmployeeService._get_employee(db, company_id, employee_id)

            old_values = EmployeeService._employee_snapshot(employee)
            payload = dict(data)
            custom_fields = payload.pop("custom_fields", {}) or {}

            # Do not update employee_code through this operation.
            payload.pop("employee_code", None)

            EmployeeService._validate_linked_records(
                db,
                company_id,
                payload,
                current_employee_id=employee.id,
            )

            if payload.get("user_id") is not None:
                from app.models.user import User

                user = db.get(User, payload["user_id"])
                if user is None or not user.is_active:
                    raise HTTPException(
                        status_code=422,
                        detail="Linked login user does not exist or is inactive.",
                    )

            for field, value in payload.items():
                if hasattr(employee, field):
                    setattr(employee, field, value)

            EmployeeService._save_custom_fields(db, company_id, employee, custom_fields)

            self_new_values = EmployeeService._employee_snapshot(employee)
            EmployeeService._log(
                db=db,
                user_id=current_user.id,
                account_id=company.account_id,
                company_id=company_id,
                employee=employee,
                action="UPDATED",
                description=f"Updated employee {employee.employee_code}.",
                old_values=old_values,
                new_values=self_new_values,
            )

            db.commit()
            db.refresh(employee)
            return employee

        except HTTPException:
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="The update conflicts with an existing employee record.",
            ) from exc
        except Exception:
            db.rollback()
            raise
