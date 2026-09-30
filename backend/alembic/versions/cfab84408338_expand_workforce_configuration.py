"""expand workforce configuration

Revision ID: cfab84408338
Revises: cddff80be0ed
Create Date: 2026-09-30 11:41:25.507769

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "cfab84408338"
down_revision: Union[str, Sequence[str], None] = "cddff80be0ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workforce_configurations",
        sa.Column(
            "setup_mode",
            sa.String(length=20),
            nullable=False,
            server_default="recommended",
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "attendance_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "early_checkout_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "auto_markout_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "attendance_regularization_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "attendance_approval_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "overtime_approval_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "remote_work_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "field_work_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "gps_attendance_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "workforce_configurations",
        sa.Column(
            "geofencing_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "workforce_configurations",
        "geofencing_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "gps_attendance_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "field_work_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "remote_work_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "overtime_approval_required",
    )

    op.drop_column(
        "workforce_configurations",
        "attendance_approval_required",
    )

    op.drop_column(
        "workforce_configurations",
        "attendance_regularization_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "auto_markout_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "early_checkout_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "attendance_enabled",
    )

    op.drop_column(
        "workforce_configurations",
        "setup_mode",
    )
