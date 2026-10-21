"""add office location to employees

Revision ID: fad6b0db4735
Revises: e197344467d4
Create Date: 2026-10-21 16:47:14.343228

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "fad6b0db4735"
down_revision: Union[str, Sequence[str], None] = "e197344467d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("office_location_id", sa.Integer(), nullable=True),
    )

    op.create_index(
        op.f("ix_employees_office_location_id"),
        "employees",
        ["office_location_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_employees_office_location_id",
        "employees",
        "office_locations",
        ["office_location_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_employees_office_location_id",
        "employees",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_employees_office_location_id"),
        table_name="employees",
    )

    op.drop_column("employees", "office_location_id")
