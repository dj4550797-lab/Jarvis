export interface PageMeta {
  id: string;
  pageNumber: number;
  title: string;
  category: 'Core' | 'Memory & Data' | 'Agents & Workflows' | 'Platform Control' | 'AI & Models' | 'Sensors & Visual' | 'Security & Diagnostics' | 'System';
  description: string;
}

export const ALL_PAGES: PageMeta[] = [
  { id: 'dashboard', pageNumber: 1, title: 'Home Dashboard', category: 'Core', description: 'Central operational view, hologram core, and health summary.' },
  { id: 'command-centre', pageNumber: 2, title: 'Universal Command Centre', category: 'Core', description: 'Natural language command planning, execution, and approval.' },
  { id: 'voice-studio', pageNumber: 3, title: 'Voice & Conversation Studio', category: 'Core', description: 'Voice state machine, offline speech recognition, and synthesis.' },
  { id: 'contextual-memory', pageNumber: 4, title: 'Contextual Memory', category: 'Memory & Data', description: 'Persistent user preferences, episodic memories, and FTS5 search.' },
  { id: 'knowledge-graph', pageNumber: 5, title: 'Knowledge Graph', category: 'Memory & Data', description: 'Visual entity relationships and concept association networks.' },
  { id: 'knowledge-vault', pageNumber: 6, title: 'Knowledge Vault', category: 'Memory & Data', description: 'Local file indexing, text chunking, and local semantic search.' },
  { id: 'multi-agent', pageNumber: 7, title: 'Multi-Agent Workbench', category: 'Agents & Workflows', description: 'Orchestration of specialized agents (Coder, Researcher, Reviewer).' },
  { id: 'long-running', pageNumber: 8, title: 'Long-Running Project Mode', category: 'Agents & Workflows', description: 'Checkpoint-based milestone tracking for complex tasks.' },
  { id: 'screen-awareness', pageNumber: 9, title: 'Screen Awareness', category: 'Platform Control', description: 'Real-time display OCR, window inspection, and desktop vision.' },
  { id: 'visual-automation', pageNumber: 10, title: 'Visual Automation Builder', category: 'Agents & Workflows', description: 'Node-based visual workflow definitions and execution.' },
  { id: 'windows-control', pageNumber: 11, title: 'Windows Desktop Control', category: 'Platform Control', description: 'Native Win32 automation, keyboard/mouse input, and window ops.' },
  { id: 'android-control', pageNumber: 12, title: 'Android App Control', category: 'Platform Control', description: 'Companion device synchronization and accessibility actions.' },
  { id: 'browser-control', pageNumber: 13, title: 'Browser & Website Control', category: 'Platform Control', description: 'CDP browser workflows, navigation, and web data extraction.' },
  { id: 'messaging-automation', pageNumber: 14, title: 'Messaging Automation', category: 'Platform Control', description: 'Automated email, notifications, and scheduled dispatches.' },
  { id: 'models-providers', pageNumber: 15, title: 'Models & API Providers', category: 'AI & Models', description: 'Local GGUF engine configuration and optional cloud API keys.' },
  { id: 'research-mode', pageNumber: 16, title: 'Research Mode', category: 'Agents & Workflows', description: 'Multi-source document synthesis and citation aggregation.' },
  { id: 'model-evaluation', pageNumber: 17, title: 'Model Evaluation Lab', category: 'AI & Models', description: 'Offline benchmark comparisons, latency metrics, and accuracy tests.' },
  { id: 'self-development', pageNumber: 18, title: 'Self-Development Lab', category: 'AI & Models', description: 'Sandboxed code self-modification with diff review and rollbacks.' },
  { id: 'model-evolution', pageNumber: 19, title: 'Model Evolution Lab', category: 'AI & Models', description: 'Local fine-tuning datasets and LoRA adaptation tracking.' },
  { id: 'file-intelligence', pageNumber: 20, title: 'Universal File Intelligence', category: 'Memory & Data', description: 'Deep metadata extraction, format conversions, and hashing.' },
  { id: 'gods-eye', pageNumber: 21, title: "God's Eye System Radar", category: 'Sensors & Visual', description: 'Local network scanning, hardware sensor radar, and host vitals.' },
  { id: 'hologram-studio', pageNumber: 22, title: 'Hologram Studio', category: 'Sensors & Visual', description: '3D hologram particle shader customization and audio physics.' },
  { id: 'security-centre', pageNumber: 23, title: 'Security & Permissions Centre', category: 'Security & Diagnostics', description: 'Risk tier policy controls, permission whitelist, and encryption.' },
  { id: 'task-centre', pageNumber: 24, title: 'Task Centre', category: 'Core', description: 'Comprehensive inspection, pausing, resuming, and task audit trail.' },
  { id: 'logs-diagnostics', pageNumber: 25, title: 'Logs & Diagnostics', category: 'Security & Diagnostics', description: 'Real-time structured application logs and diagnostic tracer.' },
  { id: 'health-monitor', pageNumber: 26, title: 'Built-in Health Monitor', category: 'Security & Diagnostics', description: 'Hardware temperature, NVMe storage, CPU/RAM telemetry.' },
  { id: 'backup-recovery', pageNumber: 27, title: 'Backup & Recovery Centre', category: 'Security & Diagnostics', description: 'Atomic SQLite hot snapshots, SHA-256 verification, and restore.' },
  { id: 'usb-recovery', pageNumber: 28, title: 'USB Recovery Drive', category: 'Security & Diagnostics', description: 'Bootable offline recovery image creator and standalone bundle.' },
  { id: 'cross-device', pageNumber: 29, title: 'Cross-Device Handoff', category: 'Platform Control', description: 'Seamless task migration between Windows and Android phone.' },
  { id: 'settings', pageNumber: 30, title: 'Settings & Customization', category: 'System', description: 'Mode toggle (Offline vs Hybrid), voice profiles, and storage.' },
  { id: 'onboarding', pageNumber: 31, title: 'Onboarding & Setup Wizard', category: 'System', description: 'First-launch walkthrough, permission requests, and models guide.' },
  { id: 'admin-control', pageNumber: 32, title: 'Admin & Project Control', category: 'System', description: 'Project memory reconstruction, Git synchronization, and PRD status.' },
];
