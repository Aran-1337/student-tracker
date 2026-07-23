type IconProps = { size?: number; style?: React.CSSProperties; className?: string; title?: string };
const icon = (path: string) => ({ size = 16, style, className, title }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-label={title}>
    <path d={path} />
  </svg>
);
const icon2 = (paths: string[]) => ({ size = 16, style, className, title }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-label={title}>
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

export const X = icon("M18 6 6 18M6 6l12 12");
export const Plus = icon("M12 5v14M5 12h14");
export const Repeat = icon2(["m17 2 4 4-4 4", "M3 11V9a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v2a4 4 0 0 1-4 4H3"]);
export const Receipt = icon2(["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z", "M16 8H8M16 12H8M12 16H8"]);
export const ChevronRight = icon("m9 18 6-6-6-6");
export const ChevronLeft = icon("m15 18-6-6 6-6");
export const TrendingDown = icon2(["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"]);
export const Home = icon2(["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"]);
export const Users = icon2(["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"]);
export const MoreHorizontal = ({ size = 16, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);
export const FileText = icon2(["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"]);
export const AlertCircle = ({ size = 16, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
  </svg>
);
export const Calendar = icon2(["M8 2v4M16 2v4", "M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"]);
export const Trash2 = icon2(["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", "M10 11v6M14 11v6"]);
export const Pencil = icon2(["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", "m15 5 4 4"]);
export const Download = icon2(["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"]);
export const Zap = icon("M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z");
export const Check = icon("M20 6 9 17l-5-5");
export const Save = icon2(["M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"]);
export const Power = icon2(["M12 2v10", "M18.4 6.6a9 9 0 1 1-12.77.04"]);
