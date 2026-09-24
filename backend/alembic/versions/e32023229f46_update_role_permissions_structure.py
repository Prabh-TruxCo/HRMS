"""update role permissions structure

Revision ID: e32023229f46
Revises: 5dfa32bcfbfd
Create Date: 2026-09-24 17:09:47.378766

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e32023229f46"
down_revision: Union[str, Sequence[str], None] = "5dfa32bcfbfd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing role_permissions table is empty,
    # so recreate it using the new structure.

    op.drop_table("role_permissions")

    op.create_table(
        "role_permissions",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "role_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "permission_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "scope",
            sa.String(length=50),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permissions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "role_id",
            "permission_id",
            "scope",
            name="uq_role_permission_scope",
        ),
    )

    op.create_index(
        "ix_role_permissions_role_id",
        "role_permissions",
        ["role_id"],
        unique=False,
    )

    op.create_index(
        "ix_role_permissions_permission_id",
        "role_permissions",
        ["permission_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_role_permissions_permission_id",
        table_name="role_permissions",
    )

    op.drop_index(
        "ix_role_permissions_role_id",
        table_name="role_permissions",
    )

    op.drop_table("role_permissions")
