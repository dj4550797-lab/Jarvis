declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Shield: LucideIcon;
  export const Cpu: LucideIcon;
  export const HardDrive: LucideIcon;
  export const Database: LucideIcon;
  export const Radio: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Send: LucideIcon;
  export const Mic: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Activity: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Clock: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const FolderGit2: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Eye: LucideIcon;
  export const Terminal: LucideIcon;
  export const Layers: LucideIcon;
  export const Network: LucideIcon;
  export const Wrench: LucideIcon;
  export const Globe: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Lock: LucideIcon;
  export const Archive: LucideIcon;
  export const Compass: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Settings: LucideIcon;
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Trash2: LucideIcon;
  export const Search: LucideIcon;
  export const FileText: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Download: LucideIcon;
  export const Upload: LucideIcon;
  export const Monitor: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const BookOpen: LucideIcon;
  export const GitBranch: LucideIcon;
  export const Share2: LucideIcon;
  export const Award: LucideIcon;
  export const Zap: LucideIcon;
  export const Sliders: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Check: LucideIcon;
  export const X: LucideIcon;
  export const Key: LucideIcon;
  export const FileDown: LucideIcon;
  export const Wifi: LucideIcon;
  export const Disc: LucideIcon;
  export const Volume2: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const History: LucideIcon;
  export const List: LucideIcon;
  export const Info: LucideIcon;
  export const Copy: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const TerminalSquare: LucideIcon;
  export const Plus: LucideIcon;
}
