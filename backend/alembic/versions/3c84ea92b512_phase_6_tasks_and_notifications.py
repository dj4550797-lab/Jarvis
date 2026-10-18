"""phase_6_tasks_and_notifications

Revision ID: 3c84ea92b512
Revises: 2b73d810f924
Create Date: 2026-10-18 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c84ea92b512'
down_revision: Union[str, None] = '2b73d810f924'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Background Tasks Table
    op.create_table(
        'background_tasks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('task_type', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='queued'),
        sa.Column('progress', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('progress_message', sa.String(length=512), nullable=True),
        sa.Column('params', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('result', sa.Text(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('timeout_seconds', sa.Float(), nullable=False, server_default='300.0'),
        sa.Column('idempotent', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_background_tasks_task_type'), 'background_tasks', ['task_type'], unique=False)
    op.create_index(op.f('ix_background_tasks_status'), 'background_tasks', ['status'], unique=False)
    op.create_index(op.f('ix_background_tasks_created_at'), 'background_tasks', ['created_at'], unique=False)

    # 2. Notifications Table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=32), nullable=False, server_default='normal'),
        sa.Column('category', sa.String(length=64), nullable=False, server_default='general'),
        sa.Column('read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('delivered', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('suppressed_by_dnd', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_priority'), 'notifications', ['priority'], unique=False)
    op.create_index(op.f('ix_notifications_category'), 'notifications', ['category'], unique=False)
    op.create_index(op.f('ix_notifications_read'), 'notifications', ['read'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)

    # 3. Notification Preferences Table
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('dnd_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=False, server_default='22:00'),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=False, server_default='08:00'),
        sa.Column('min_priority_during_quiet', sa.String(length=32), nullable=False, server_default='critical'),
        sa.Column('desktop_notifications_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('sound_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('notification_preferences')

    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_category'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_priority'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_background_tasks_created_at'), table_name='background_tasks')
    op.drop_index(op.f('ix_background_tasks_status'), table_name='background_tasks')
    op.drop_index(op.f('ix_background_tasks_task_type'), table_name='background_tasks')
    op.drop_table('background_tasks')
