"""create_memories_table

Revision ID: 2b73d810f924
Revises: 1e84fc83e330
Create Date: 2026-10-17 21:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b73d810f924'
down_revision: Union[str, None] = '1e84fc83e330'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'memories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('memory_type', sa.String(length=50), nullable=False, server_default='explicit_fact'),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('is_uncertain', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('source', sa.String(length=100), nullable=False, server_default='user'),
        sa.Column('tags_json', sa.Text(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_memories_memory_type'), 'memories', ['memory_type'], unique=False)
    op.create_index(op.f('ix_memories_category'), 'memories', ['category'], unique=False)
    op.create_index(op.f('ix_memories_is_uncertain'), 'memories', ['is_uncertain'], unique=False)
    op.create_index(op.f('ix_memories_created_at'), 'memories', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_memories_created_at'), table_name='memories')
    op.drop_index(op.f('ix_memories_is_uncertain'), table_name='memories')
    op.drop_index(op.f('ix_memories_category'), table_name='memories')
    op.drop_index(op.f('ix_memories_memory_type'), table_name='memories')
    op.drop_table('memories')
