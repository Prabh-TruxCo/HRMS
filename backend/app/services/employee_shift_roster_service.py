from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.employee import Employee
from app.models.employee_shift_assignment import EmployeeShiftAssignment
from app.models.employee_shift_roster import EmployeeShiftRoster
from app.models.employee_shift_roster_day import EmployeeShiftRosterDay
from app.models.shift import Shift
from app.services.audit_log_service import AuditLogService


class EmployeeShiftRosterService:
    MODULE = "EMPLOYEE_SHIFT_ROSTER"

    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditLogService(db)

    def _get_employee(
        self,
        company_id: int,
        employee_id: int,
    ) -> Employee:
        employee = (
            self.db.query(Employee)
            .filter(
                Employee.id == employee_id,
                Employee.company_id == company_id,
            )
            .first()
        )

        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found in this company.",
            )

        return employee

    def _validate_shifts(
        self,
        company_id: int,
        days,
    ) -> None:
        shift_ids = {day.shift_id for day in days if day.shift_id is not None}

        if not shift_ids:
            return

        shifts = (
            self.db.query(Shift)
            .filter(
                Shift.company_id == company_id,
                Shift.id.in_(shift_ids),
            )
            .all()
        )

        found_ids = {shift.id for shift in shifts}

        if found_ids != shift_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more shifts do not belong to this company.",
            )

        inactive_ids = {shift.id for shift in shifts if not shift.is_active}

        if inactive_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive shifts cannot be assigned to a new roster.",
            )

    def create_roster(
        self,
        *,
        company_id: int,
        current_user,
        payload,
    ) -> EmployeeShiftRoster:
        self._get_employee(company_id, payload.employee_id)
        self._validate_shifts(company_id, payload.days)

        if (
            payload.effective_to is not None
            and payload.effective_to < payload.effective_from
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Effective end date cannot be before the start date.",
            )

        overlapping_roster = (
            self.db.query(EmployeeShiftRoster)
            .filter(
                EmployeeShiftRoster.company_id == company_id,
                EmployeeShiftRoster.employee_id == payload.employee_id,
                EmployeeShiftRoster.is_active.is_(True),
                EmployeeShiftRoster.effective_from
                <= (payload.effective_to or date.max),
            )
            .filter(
                (EmployeeShiftRoster.effective_to.is_(None))
                | (EmployeeShiftRoster.effective_to >= payload.effective_from)
            )
            .first()
        )

        if overlapping_roster:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An active roster already overlaps this employee's "
                    "requested effective date range."
                ),
            )

        roster = EmployeeShiftRoster(
            company_id=company_id,
            employee_id=payload.employee_id,
            name=payload.name.strip(),
            effective_from=payload.effective_from,
            effective_to=payload.effective_to,
            is_active=True,
            notes=payload.notes,
        )

        try:
            self.db.add(roster)
            self.db.flush()

            for day in payload.days:
                roster_day = EmployeeShiftRosterDay(
                    roster_id=roster.id,
                    weekday=day.weekday,
                    shift_id=day.shift_id,
                    is_day_off=day.is_day_off,
                )
                self.db.add(roster_day)

            self.audit_service.log(
                user_id=current_user.id,
                account_id=getattr(current_user, "account_id", None),
                company_id=company_id,
                module=self.MODULE,
                entity_type="EMPLOYEE_SHIFT_ROSTER",
                entity_id=roster.id,
                action="CREATE",
                description=f"Created shift roster '{roster.name}'.",
                new_values={
                    "employee_id": roster.employee_id,
                    "name": roster.name,
                    "effective_from": roster.effective_from.isoformat(),
                    "effective_to": (
                        roster.effective_to.isoformat() if roster.effective_to else None
                    ),
                    "days": [
                        {
                            "weekday": day.weekday,
                            "shift_id": day.shift_id,
                            "is_day_off": day.is_day_off,
                        }
                        for day in payload.days
                    ],
                },
            )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return self.get_roster(company_id, roster.id)

    def get_roster(
        self,
        company_id: int,
        roster_id: int,
    ) -> EmployeeShiftRoster:
        roster = (
            self.db.query(EmployeeShiftRoster)
            .options(selectinload(EmployeeShiftRoster.days))
            .filter(
                EmployeeShiftRoster.company_id == company_id,
                EmployeeShiftRoster.id == roster_id,
            )
            .first()
        )

        if roster is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift roster not found.",
            )

        return roster

    def list_rosters(
        self,
        *,
        company_id: int,
        employee_id: int | None = None,
        is_active: bool | None = None,
    ) -> list[EmployeeShiftRoster]:
        query = (
            self.db.query(EmployeeShiftRoster)
            .options(selectinload(EmployeeShiftRoster.days))
            .filter(EmployeeShiftRoster.company_id == company_id)
        )

        if employee_id is not None:
            query = query.filter(EmployeeShiftRoster.employee_id == employee_id)

        if is_active is not None:
            query = query.filter(EmployeeShiftRoster.is_active.is_(is_active))

        return query.order_by(
            EmployeeShiftRoster.effective_from.desc(),
            EmployeeShiftRoster.id.desc(),
        ).all()

    def _get_assignment(
        self,
        company_id: int,
        assignment_id: int,
    ) -> EmployeeShiftAssignment:
        assignment = (
            self.db.query(EmployeeShiftAssignment)
            .filter(
                EmployeeShiftAssignment.company_id == company_id,
                EmployeeShiftAssignment.id == assignment_id,
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift assignment not found.",
            )

        return assignment

    def _validate_assignment_shift(
        self,
        company_id: int,
        shift_id: int | None,
        is_day_off: bool,
    ) -> None:
        if is_day_off:
            if shift_id is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A day off cannot have a shift assigned.",
                )
            return

        if shift_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A shift is required for a working day.",
            )

        shift = (
            self.db.query(Shift)
            .filter(
                Shift.id == shift_id,
                Shift.company_id == company_id,
            )
            .first()
        )

        if shift is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift not found in this company.",
            )

        if not shift.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An inactive shift cannot be assigned.",
            )

    @staticmethod
    def _assignment_values(
        assignment: EmployeeShiftAssignment,
    ) -> dict:
        return {
            "employee_id": assignment.employee_id,
            "work_date": assignment.work_date.isoformat(),
            "shift_id": assignment.shift_id,
            "is_day_off": assignment.is_day_off,
            "reason": assignment.reason,
        }

    def create_assignment(
        self,
        *,
        company_id: int,
        current_user,
        payload,
    ) -> EmployeeShiftAssignment:
        self._get_employee(company_id, payload.employee_id)

        self._validate_assignment_shift(
            company_id,
            payload.shift_id,
            payload.is_day_off,
        )

        existing = (
            self.db.query(EmployeeShiftAssignment)
            .filter(
                EmployeeShiftAssignment.company_id == company_id,
                EmployeeShiftAssignment.employee_id == payload.employee_id,
                EmployeeShiftAssignment.work_date == payload.work_date,
            )
            .first()
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An assignment already exists for this employee "
                    "on this date. Update the existing assignment instead."
                ),
            )

        assignment = EmployeeShiftAssignment(
            company_id=company_id,
            employee_id=payload.employee_id,
            work_date=payload.work_date,
            shift_id=payload.shift_id,
            is_day_off=payload.is_day_off,
            reason=payload.reason,
            assigned_by=current_user.id,
        )

        try:
            self.db.add(assignment)
            self.db.flush()

            self.audit_service.log(
                user_id=current_user.id,
                account_id=getattr(current_user, "account_id", None),
                company_id=company_id,
                module=self.MODULE,
                entity_type="EMPLOYEE_SHIFT_ASSIGNMENT",
                entity_id=assignment.id,
                action="CREATE",
                description=(
                    f"Created shift assignment for employee "
                    f"{assignment.employee_id} on "
                    f"{assignment.work_date.isoformat()}."
                ),
                new_values=self._assignment_values(assignment),
            )

            self.db.commit()
            self.db.refresh(assignment)

        except Exception:
            self.db.rollback()
            raise

        return assignment

    def update_assignment(
        self,
        *,
        company_id: int,
        assignment_id: int,
        current_user,
        payload,
    ) -> EmployeeShiftAssignment:
        assignment = self._get_assignment(company_id, assignment_id)

        old_values = self._assignment_values(assignment)
        supplied = payload.model_fields_set

        new_date = (
            payload.work_date if "work_date" in supplied else assignment.work_date
        )

        new_shift_id = (
            payload.shift_id if "shift_id" in supplied else assignment.shift_id
        )

        new_is_day_off = (
            payload.is_day_off if "is_day_off" in supplied else assignment.is_day_off
        )

        # When changing a day off back to a working day, the request
        # must provide a shift unless the existing assignment has one.
        if new_is_day_off and "shift_id" not in supplied:
            new_shift_id = None

        self._validate_assignment_shift(
            company_id,
            new_shift_id,
            new_is_day_off,
        )

        duplicate = (
            self.db.query(EmployeeShiftAssignment)
            .filter(
                EmployeeShiftAssignment.company_id == company_id,
                EmployeeShiftAssignment.employee_id == assignment.employee_id,
                EmployeeShiftAssignment.work_date == new_date,
                EmployeeShiftAssignment.id != assignment.id,
            )
            .first()
        )

        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Another assignment already exists for this employee "
                    "on the selected date."
                ),
            )

        try:
            assignment.work_date = new_date
            assignment.shift_id = new_shift_id
            assignment.is_day_off = new_is_day_off

            if "reason" in supplied:
                assignment.reason = payload.reason

            # Record who last changed this assignment.
            assignment.assigned_by = current_user.id

            self.db.flush()

            self.audit_service.log(
                user_id=current_user.id,
                account_id=getattr(current_user, "account_id", None),
                company_id=company_id,
                module=self.MODULE,
                entity_type="EMPLOYEE_SHIFT_ASSIGNMENT",
                entity_id=assignment.id,
                action="UPDATE",
                description=(
                    f"Updated shift assignment for employee "
                    f"{assignment.employee_id} on "
                    f"{assignment.work_date.isoformat()}."
                ),
                old_values=old_values,
                new_values=self._assignment_values(assignment),
            )

            self.db.commit()
            self.db.refresh(assignment)

        except Exception:
            self.db.rollback()
            raise

        return assignment

    def list_assignments(
        self,
        *,
        company_id: int,
        start_date: date,
        end_date: date,
        employee_id: int | None = None,
    ) -> list[EmployeeShiftAssignment]:
        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date.",
            )

        query = self.db.query(EmployeeShiftAssignment).filter(
            EmployeeShiftAssignment.company_id == company_id,
            EmployeeShiftAssignment.work_date >= start_date,
            EmployeeShiftAssignment.work_date <= end_date,
        )

        if employee_id is not None:
            query = query.filter(EmployeeShiftAssignment.employee_id == employee_id)

        return query.order_by(
            EmployeeShiftAssignment.work_date,
            EmployeeShiftAssignment.employee_id,
        ).all()

    def resolve_effective_shift(
        self,
        *,
        company_id: int,
        employee_id: int,
        work_date: date,
    ) -> dict:
        """
        Resolve an employee's effective shift for a date.

        Priority:
        1. Date-specific assignment.
        2. Active weekly roster.
        3. No scheduled shift.
        """
        # Ensure the employee belongs to the selected company.
        self._get_employee(company_id, employee_id)

        # ---------------------------------------------------------
        # 1. Check for a date-specific assignment or day-off override.
        # ---------------------------------------------------------
        assignment = (
            self.db.query(EmployeeShiftAssignment)
            .filter(
                EmployeeShiftAssignment.company_id == company_id,
                EmployeeShiftAssignment.employee_id == employee_id,
                EmployeeShiftAssignment.work_date == work_date,
            )
            .first()
        )

        if assignment is not None:
            shift = None

            if assignment.shift_id is not None:
                shift = (
                    self.db.query(Shift)
                    .filter(
                        Shift.id == assignment.shift_id,
                        Shift.company_id == company_id,
                    )
                    .first()
                )

            return {
                "company_id": company_id,
                "employee_id": employee_id,
                "work_date": work_date,
                "scheduled": True,
                "is_day_off": assignment.is_day_off,
                "shift_id": shift.id if shift else None,
                "shift_name": shift.name if shift else None,
                "shift_code": shift.code if shift else None,
                "source": "date_assignment",
                "reason": assignment.reason,
            }

        # ---------------------------------------------------------
        # 2. Find the active weekly roster covering this date.
        # ---------------------------------------------------------
        roster = (
            self.db.query(EmployeeShiftRoster)
            .options(selectinload(EmployeeShiftRoster.days))
            .filter(
                EmployeeShiftRoster.company_id == company_id,
                EmployeeShiftRoster.employee_id == employee_id,
                EmployeeShiftRoster.is_active.is_(True),
                EmployeeShiftRoster.effective_from <= work_date,
                (
                    EmployeeShiftRoster.effective_to.is_(None)
                    | (EmployeeShiftRoster.effective_to >= work_date)
                ),
            )
            .order_by(
                EmployeeShiftRoster.effective_from.desc(),
                EmployeeShiftRoster.id.desc(),
            )
            .first()
        )

        if roster is not None:
            weekday = work_date.weekday()

            roster_day = next(
                (day for day in roster.days if day.weekday == weekday),
                None,
            )

            if roster_day is not None:
                shift = None

                if roster_day.shift_id is not None:
                    shift = (
                        self.db.query(Shift)
                        .filter(
                            Shift.id == roster_day.shift_id,
                            Shift.company_id == company_id,
                        )
                        .first()
                    )

                return {
                    "company_id": company_id,
                    "employee_id": employee_id,
                    "work_date": work_date,
                    "scheduled": True,
                    "is_day_off": roster_day.is_day_off,
                    "shift_id": shift.id if shift else None,
                    "shift_name": shift.name if shift else None,
                    "shift_code": shift.code if shift else None,
                    "source": "weekly_roster",
                    "reason": roster.name,
                }

        # ---------------------------------------------------------
        # 3. No applicable assignment or weekly roster.
        # ---------------------------------------------------------
        return {
            "company_id": company_id,
            "employee_id": employee_id,
            "work_date": work_date,
            "scheduled": False,
            "is_day_off": False,
            "shift_id": None,
            "shift_name": None,
            "shift_code": None,
            "source": "none",
            "reason": None,
        }
