
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.employee import EmployeeIdSequence
from app.schemas.employee_id_settings import EmployeeIdSettingsUpdate


class EmployeeIdSettingsService:

    @staticmethod
    def get_settings(
        db: Session,
        company_id: int,
    ) -> EmployeeIdSequence:
        sequence = db.scalar(
            select(EmployeeIdSequence).where(
                EmployeeIdSequence.company_id == company_id
            )
        )

        if sequence is None:
            sequence = EmployeeIdSequence(
                company_id=company_id,
                prefix="EMP",
                next_number=1,
                number_padding=4,
            )
            db.add(sequence)

            try:
                db.commit()
                db.refresh(sequence)
            except Exception:
                db.rollback()

                # Another request may have created the settings
                # concurrently. Read the row that now exists.
                sequence = db.scalar(
                    select(EmployeeIdSequence).where(
                        EmployeeIdSequence.company_id == company_id
                    )
                )

                if sequence is None:
                    raise

        return sequence

    @staticmethod
    def update_settings(
        db: Session,
        company_id: int,
        payload: EmployeeIdSettingsUpdate,
    ) -> EmployeeIdSequence:
        prefix = payload.prefix.strip().upper()

        if not prefix:
            raise HTTPException(
                status_code=422,
                detail="Employee ID prefix cannot be empty.",
            )

        # Lock the company-specific settings row.
        sequence = db.scalar(
            select(EmployeeIdSequence)
            .where(EmployeeIdSequence.company_id == company_id)
            .with_for_update()
        )

        if sequence is None:
            sequence = EmployeeIdSequence(
                company_id=company_id,
                prefix=prefix,
                next_number=payload.next_number,
                number_padding=payload.number_padding,
            )
            db.add(sequence)
        else:
            sequence.prefix = prefix
            sequence.next_number = payload.next_number
            sequence.number_padding = payload.number_padding

        try:
            db.commit()
            db.refresh(sequence)
        except Exception:
            db.rollback()
            raise

        return sequence
