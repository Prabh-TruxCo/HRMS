"""add post assignment to employees

Revision ID: e197344467d4
Revises: b53801900569
Create Date: 2026-10-16 14:12:37.100132
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e197344467d4"
down_revision: Union[str, Sequence[str], None] = "b53801900569"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column("post_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_employees_post_id",
        "employees",
        ["post_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_employees_post_id_posts",
        "employees",
        "posts",
        ["post_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_employees_post_id_posts",
        "employees",
        type_="foreignkey",
    )
    op.drop_index("ix_employees_post_id", table_name="employees")
    op.drop_column("employees", "post_id")
