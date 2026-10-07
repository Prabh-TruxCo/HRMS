"""remove company industry type

Revision ID: f43eddec9975
Revises: 4bfefe2e8013
Create Date: 2026-10-07 16:40:52.427507

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f43eddec9975"
down_revision: Union[str, Sequence[str], None] = "4bfefe2e8013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("companies", "industry_type")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "companies",
        sa.Column(
            "industry_type",
            sa.String(length=100),
            nullable=False,
        ),
    )
