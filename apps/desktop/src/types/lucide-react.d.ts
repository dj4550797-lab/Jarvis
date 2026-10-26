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
}
