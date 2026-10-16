
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.employee import EmployeeFieldDefinition
from app.services.audit_log_service import AuditLogService


class EmployeeFieldService:
    MODULE = "EMPLOYEES"
    ENTITY = "EMPLOYEE_FIELD_DEFINITION"

    @staticmethod
    def _get_company(db: Session, company_id: int) -> Company:
        company = db.scalar(
            select(Company).where(Company.id == company_id)
        )
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found.",
            )
        return company

    @staticmethod
    def _get_field(
        db: Session,
        company_id: int,
        field_id: int,
    ) -> EmployeeFieldDefinition:
        field = db.scalar(
            select(EmployeeFieldDefinition).where(
                EmployeeFieldDefinition.id == field_id,
                EmployeeFieldDefinition.company_id == company_id,
            )
        )
        if not field:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee field definition not found.",
            )
        return field

    @staticmethod
    def _snapshot(field: EmployeeFieldDefinition) -> dict[str, Any]:
        return {
            "id": field.id,
            "field_key": field.field_key,
            "label": field.label,
            "section": field.section,
            "description": field.description,
            "field_type": field.field_type,
            "is_required": field.is_required,
            "is_active": field.is_active,
            "display_order": field.display_order,
            "options_json": field.options_json,
            "validation_json": field.validation_json,
            "is_searchable": field.is_searchable,
        }

    @staticmethod
    def _validate_configuration(
        field_type: str,
        options_json: dict | list | None,
    ) -> None:
        if field_type in {"SELECT", "MULTISELECT"}:
            if not options_json:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        f"{field_type} fields must define options_json."
                    ),
                )

    @staticmethod
    def list_fields(
        db: Session,
        company_id: int,
        include_inactive: bool = True,
    ) -> dict[str, Any]:
        EmployeeFieldService._get_company(db, company_id)

        filters = [
            EmployeeFieldDefinition.company_id == company_id
        ]

        if not include_inactive:
            filters.append(EmployeeFieldDefinition.is_active.is_(True))

        fields = list(
            db.scalars(
                select(EmployeeFieldDefinition)
                .where(*filters)
                .order_by(
                    EmployeeFieldDefinition.display_order.asc(),
                    EmployeeFieldDefinition.id.asc(),
                )
            ).all()
        )

        return {"fields": fields, "total": len(fields)}

    @staticmethod
    def create_field(
        db: Session,
        company_id: int,
        data: dict[str, Any],
        current_user: Any,
    ) -> EmployeeFieldDefinition:
        EmployeeFieldService._get_company(db, company_id)

        field_key = data["field_key"].strip().lower()
        data["field_key"] = field_key

        existing = db.scalar(
            select(EmployeeFieldDefinition.id).where(
                EmployeeFieldDefinition.company_id == company_id,
                EmployeeFieldDefinition.field_key == field_key,
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A field with this key already exists.",
            )

        EmployeeFieldService._validate_configuration(
            data["field_type"],
            data.get("options_json"),
        )

        try:
            field = EmployeeFieldDefinition(
                company_id=company_id,
                **data,
            )
            db.add(field)
            db.flush()

            AuditLogService(db).log(
                user_id=current_user.id,
                account_id=EmployeeFieldService._get_company(
                    db, company_id
                ).account_id,
                company_id=company_id,
                module=EmployeeFieldService.MODULE,
                entity_type=EmployeeFieldService.ENTITY,
                entity_id=field.id,
                action="CREATED",
                description=f"Created employee field '{field.label}'.",
                old_values=None,
                new_values=EmployeeFieldService._snapshot(field),
            )

            db.commit()
            db.refresh(field)
            return field

        except HTTPException:
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The employee field conflicts with an existing field.",
            ) from exc
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def update_field(
        db: Session,
        company_id: int,
        field_id: int,
        data: dict[str, Any],
        current_user: Any,
    ) -> EmployeeFieldDefinition:
        EmployeeFieldService._get_company(db, company_id)
        field = EmployeeFieldService._get_field(
            db, company_id, field_id
        )

        changes = {
            key: value
            for key, value in data.items()
            if key in {
                "label",
                "section",
                "description",
                "field_type",
                "is_required",
                "is_active",
                "display_order",
                "options_json",
                "validation_json",
                "is_searchable",
            }
        }

        if not changes:
            return field

        old_values = EmployeeFieldService._snapshot(field)

        effective_type = changes.get("field_type", field.field_type)
        effective_options = changes.get(
            "options_json", field.options_json
        )

        EmployeeFieldService._validate_configuration(
            effective_type,
            effective_options,
        )

        try:
            for key, value in changes.items():
                setattr(field, key, value)

            db.flush()

            AuditLogService(db).log(
                user_id=current_user.id,
                account_id=EmployeeFieldService._get_company(
                    db, company_id
                ).account_id,
                company_id=company_id,
                module=EmployeeFieldService.MODULE,
                entity_type=EmployeeFieldService.ENTITY,
                entity_id=field.id,
                action="UPDATED",
                description=f"Updated employee field '{field.label}'.",
                old_values=old_values,
                new_values=EmployeeFieldService._snapshot(field),
            )

            db.commit()
            db.refresh(field)
            return field

        except HTTPException:
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The employee field could not be updated.",
            ) from exc
        except Exception:
            db.rollback()
            raise
