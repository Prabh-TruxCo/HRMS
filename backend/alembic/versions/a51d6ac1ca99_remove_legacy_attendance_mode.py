"""remove legacy attendance mode

Revision ID: a51d6ac1ca99
Revises: 0f12b69f6833
Create Date: 2026-09-30 12:56:38.928070

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a51d6ac1ca99"
down_revision: Union[str, Sequence[str], None] = "0f12b69f6833"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column(
        "workforce_configurations",
        "attendance_mode",
    )


def downgrade() -> None:
    op.add_column(
        "workforce_configurations",
        sa.Column(
            "attendance_mode",
            sa.String(length=20),
            nullable=True,
        ),
    )
