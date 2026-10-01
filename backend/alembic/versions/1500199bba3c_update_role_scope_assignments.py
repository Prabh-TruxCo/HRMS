"""update role scope assignments

Revision ID: 1500199bba3c
Revises: a51d6ac1ca99
Create Date: 2026-10-01 11:45:35.276084

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "1500199bba3c"
down_revision: Union[str, Sequence[str], None] = "a51d6ac1ca99"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("role_permission_scope_assignments")

    op.create_table(
        "role_permission_scope_assignments",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "membership_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "role_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "scope",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "scope_entity_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["membership_id"],
            ["company_memberships.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "membership_id",
            "role_id",
            "scope",
            "scope_entity_id",
            name="uq_member_role_scope_entity",
        ),
    )

    op.create_index(
        "ix_role_permission_scope_assignments_membership_id",
        "role_permission_scope_assignments",
        ["membership_id"],
    )

    op.create_index(
        "ix_role_permission_scope_assignments_role_id",
        "role_permission_scope_assignments",
        ["role_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_role_permission_scope_assignments_role_id",
        table_name="role_permission_scope_assignments",
    )

    op.drop_index(
        "ix_role_permission_scope_assignments_membership_id",
        table_name="role_permission_scope_assignments",
    )

    op.drop_table("role_permission_scope_assignments")

    op.create_table(
        "role_permission_scope_assignments",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "role_permission_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "scope_entity_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["role_permission_id"],
            ["role_permissions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_role_permission_scope_assignments_role_permission_id",
        "role_permission_scope_assignments",
        ["role_permission_id"],
    )
