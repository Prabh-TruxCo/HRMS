"""add attendance methods to workforce configuration

Revision ID: 0f12b69f6833
Revises: cfab84408338
Create Date: 2026-09-30 12:37:48.639824

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0f12b69f6833"
down_revision: Union[str, Sequence[str], None] = "cfab84408338"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workforce_configurations",
        sa.Column(
            "attendance_methods",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[\"web\"]'"),
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "workforce_configurations",
        "attendance_methods",
    )
