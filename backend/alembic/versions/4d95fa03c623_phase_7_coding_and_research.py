"""phase_7_coding_and_research

Revision ID: 4d95fa03c623
Revises: 3c84ea92b512
Create Date: 2026-10-18 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d95fa03c623'
down_revision: Union[str, None] = '3c84ea92b512'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Code Snapshots Table
    op.create_table(
        'code_snapshots',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('original_content', sa.Text(), nullable=False),
        sa.Column('diff_patch', sa.Text(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False, server_default='Code modification'),
        sa.Column('restored', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('restored_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_code_snapshots_file_path'), 'code_snapshots', ['file_path'], unique=False)
    op.create_index(op.f('ix_code_snapshots_created_at'), 'code_snapshots', ['created_at'], unique=False)

    # 2. Research Sessions Table
    op.create_table(
        'research_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('topic', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_research_sessions_status'), 'research_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_research_sessions_created_at'), 'research_sessions', ['created_at'], unique=False)

    # 3. Research Sources Table
    op.create_table(
        'research_sources',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('url', sa.String(length=1024), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('snippet', sa.Text(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['research_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_research_sources_session_id'), 'research_sources', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_table('research_sources')
    op.drop_table('research_sessions')
    op.drop_table('code_snapshots')
