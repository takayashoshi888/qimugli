declare module 'lucide-react' {
  import * as React from 'react';

  export interface IconProps extends React.SVGAttributes<SVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }

  export type Icon = React.FC<IconProps>;

  export const LayoutDashboard: Icon;
  export const FileText: Icon;
  export const Users: Icon;
  export const Map: Icon;
  export const Wand2: Icon;
  export const Loader2: Icon;
  export const MapPin: Icon;
  export const Download: Icon;
  export const Edit: Icon;
  export const Trash2: Icon;
  export const Plus: Icon;
  export const UserPlus: Icon;
  export const Building2: Icon;
  export const Briefcase: Icon;
  export const UserCog: Icon;
  export const UserMinus: Icon;
  export const FileDown: Icon;
  export const Menu: Icon;
  export const LogOut: Icon;
  export const Settings: Icon;
  export const Sun: Icon;
  export const Moon: Icon;
  export const Palette: Icon;
  export const ChevronRight: Icon;
  export const X: Icon;
  export const Calendar: Icon;
  export const History: Icon;
  export const DollarSign: Icon;
  export const CheckCircle2: Icon;
  export const ArrowRight: Icon;
  export const LogIn: Icon;
  export const Lock: Icon;
  export const User: Icon;
  export const AlertCircle: Icon;
  export const CheckCircle: Icon;
}
