"""add site geopoint and geofence

Revision ID: 52ebd7765706
Revises: 953caaa311e4
Create Date: 2026-10-14 11:16:13.287337

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "52ebd7765706"
down_revision: Union[str, Sequence[str], None] = "953caaa311e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "sites",
        sa.Column("latitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "sites",
        sa.Column("longitude", sa.Float(), nullable=True),
    )
    op.add_column(
        "sites",
        sa.Column("geofence_radius", sa.Integer(), nullable=True),
    )
    op.add_column(
        "sites",
        sa.Column(
            "is_geofence_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("sites", "is_geofence_enabled")
    op.drop_column("sites", "geofence_radius")
    op.drop_column("sites", "longitude")
    op.drop_column("sites", "latitude")

    # ### end Alembic commands ###
