"""phase_8_content_and_agents

Revision ID: 5e92ab01c734
Revises: 4d95fa03c623
Create Date: 2026-10-18 17:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e92ab01c734'
down_revision: Union[str, None] = '4d95fa03c623'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Content Projects Table
    op.create_table(
        'content_projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('topic', sa.String(length=512), nullable=False),
        sa.Column('target_platform', sa.String(length=64), nullable=False, server_default='youtube_documentary'),
        sa.Column('target_duration_seconds', sa.Integer(), nullable=False, server_default='180'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='draft'),
        sa.Column('synopsis', sa.Text(), nullable=True),
        sa.Column('outline', sa.Text(), nullable=True),
        sa.Column('raw_script', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_content_projects_status'), 'content_projects', ['status'], unique=False)
    op.create_index(op.f('ix_content_projects_created_at'), 'content_projects', ['created_at'], unique=False)

    # 2. Scene Breakdowns Table
    op.create_table(
        'scene_breakdowns',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('scene_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('narration_text', sa.Text(), nullable=False, server_default=''),
        sa.Column('visual_prompt', sa.Text(), nullable=True),
        sa.Column('camera_direction', sa.String(length=255), nullable=True),
        sa.Column('audio_cues', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('asset_status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['content_projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scene_breakdowns_project_id'), 'scene_breakdowns', ['project_id'], unique=False)
    op.create_index(op.f('ix_scene_breakdowns_scene_number'), 'scene_breakdowns', ['scene_number'], unique=False)

    # 3. Agent Workflow Runs Table
    op.create_table(
        'agent_workflow_runs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('goal', sa.String(length=512), nullable=False),
        sa.Column('agent_type', sa.String(length=64), nullable=False, server_default='multi_orchestrated'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='queued'),
        sa.Column('current_step', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_steps', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('input_payload_json', sa.Text(), nullable=True),
        sa.Column('output_payload_json', sa.Text(), nullable=True),
        sa.Column('trace_log_json', sa.Text(), nullable=True),
        sa.Column('error_message', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agent_workflow_runs_status'), 'agent_workflow_runs', ['status'], unique=False)
    op.create_index(op.f('ix_agent_workflow_runs_created_at'), 'agent_workflow_runs', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('agent_workflow_runs')
    op.drop_table('scene_breakdowns')
    op.drop_table('content_projects')
