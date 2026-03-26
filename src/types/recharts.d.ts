declare module 'recharts' {
  import * as React from 'react';

  export interface ResponsiveContainerProps {
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    children?: React.ReactNode;
  }

  export interface BarChartProps {
    data?: any[];
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    children?: React.ReactNode;
  }

  export interface PieChartProps {
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }

  export interface BarProps {
    dataKey: string;
    fill?: string;
    radius?: number | [number, number, number, number];
    name?: string;
  }

  export interface XAxisProps {
    dataKey?: string;
    tick?: { fontSize?: number; fill?: string };
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  }

  export interface YAxisProps {
    tick?: { fontSize?: number; fill?: string };
  }

  export interface CartesianGridProps {
    strokeDasharray?: string;
    vertical?: boolean;
    stroke?: string;
  }

  export interface TooltipProps {
    cursor?: { fill?: string };
    contentStyle?: React.CSSProperties;
  }

  export interface LegendProps {
    verticalAlign?: 'top' | 'middle' | 'bottom';
    height?: number;
  }

  export interface PieProps {
    data?: any[];
    dataKey?: string;
    nameKey?: string;
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number | string;
    outerRadius?: number | string;
    paddingAngle?: number;
    children?: React.ReactNode;
  }

  export interface CellProps {
    key?: string | number;
    fill?: string;
    strokeWidth?: number;
  }

  export const ResponsiveContainer: React.FC<ResponsiveContainerProps>;
  export const BarChart: React.FC<BarChartProps>;
  export const PieChart: React.FC<PieChartProps>;
  export const Bar: React.FC<BarProps>;
  export const XAxis: React.FC<XAxisProps>;
  export const YAxis: React.FC<YAxisProps>;
  export const CartesianGrid: React.FC<CartesianGridProps>;
  export const Tooltip: React.FC<TooltipProps>;
  export const Legend: React.FC<LegendProps>;
  export const Pie: React.FC<PieProps>;
  export const Cell: React.FC<CellProps>;
}
