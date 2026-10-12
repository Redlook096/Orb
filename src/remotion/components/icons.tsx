import React from "react";

type P = { size?: number; color?: string; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode; viewBox?: string; fill?: boolean }> = ({
  size = 24,
  color = "currentColor",
  style,
  children,
  viewBox = "0 0 24 24",
  fill = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill ? color : "none"}
    stroke={fill ? "none" : color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const UpvoteIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 3.5 4 12.2h4.6V20h6.8v-7.8H20z" />
  </Svg>
);
export const DownvoteIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 20.5 4 11.8h4.6V4h6.8v7.8H20z" />
  </Svg>
);
export const CommentIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12z" />
  </Svg>
);
export const ShareIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14 4l7 7-7 7v-4c-5 0-8 1.6-10 5 .6-5.2 3.4-9.3 10-10z" />
  </Svg>
);
export const VerifiedBadge: React.FC<P> = ({ size = 24, color = "#1D9BF0", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }}>
    <path
      fill={color}
      d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
    />
    <path fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" d="m7.8 12.3 2.9 2.9 5.6-6" />
  </svg>
);
export const ReplyIcon = CommentIcon;
export const RetweetIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 9V7a2 2 0 0 1 2-2h11l-3-3M20 15v2a2 2 0 0 1-2 2H7l3 3" />
  </Svg>
);
export const HeartIcon: React.FC<P & { filled?: boolean }> = ({ filled, ...p }) => (
  <Svg {...p} fill={filled}>
    <path d="M12 20.5s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.9c0 5.9-8 10.6-8 10.6z" />
  </Svg>
);
export const ViewsIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M5 20V12M10 20V6M15 20v-9M20 20V9" />
  </Svg>
);
export const BookmarkIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 3.5h12V21l-6-4-6 4z" />
  </Svg>
);
export const ChevronLeft: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M15 4l-8 8 8 8" />
  </Svg>
);
export const ChevronRight: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M9 4l8 8-8 8" />
  </Svg>
);
export const VideoCallIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="3" />
    <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
  </Svg>
);
export const PhoneIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M5 3h3.5l2 5-2.5 1.5a11 11 0 0 0 6.5 6.5L16 13.5l5 2V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
  </Svg>
);
export const SendIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);
export const SparkleIcon: React.FC<P> = ({ size = 24, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, ...style }}>
    <path fill={color} d="M12 2c.5 4.9 2.6 7.1 7.5 7.5v1C14.6 11 12.5 13.1 12 18h-1c-.5-4.9-2.6-7-7.5-7.5v-1C8.4 9 10.5 6.9 11 2z" />
    <path fill={color} d="M19 15c.2 2 1 2.8 3 3v.6c-2 .2-2.8 1-3 3h-.6c-.2-2-1-2.8-3-3V18c2-.2 2.8-1 3-3z" />
  </svg>
);
export const CameraIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);
export const MicIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);
export const PlusIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const InfoIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </Svg>
);

export const StatusBar: React.FC<{ color: string; time?: string; height?: number }> = ({ color, time = "9:41", height = 70 }) => (
  <div
    style={{
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 56px",
      color,
      fontWeight: 600,
      fontSize: 34,
      fontFamily: "Inter, sans-serif",
      flexShrink: 0,
    }}
  >
    <span>{time}</span>
    <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <svg width="38" height="24" viewBox="0 0 19 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={9 - i * 3} width="3.4" height={3 + i * 3} rx="1" fill={color} />
        ))}
      </svg>
      <svg width="34" height="24" viewBox="0 0 17 12">
        <path d="M8.5 11.5 6.2 9a3.3 3.3 0 0 1 4.6 0zM3.9 6.7a6.6 6.6 0 0 1 9.2 0l-1.4 1.4a4.6 4.6 0 0 0-6.4 0zM1.6 4.4a9.8 9.8 0 0 1 13.8 0L14 5.8a7.8 7.8 0 0 0-11 0z" fill={color} />
      </svg>
      <svg width="54" height="26" viewBox="0 0 27 13">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke={color} opacity="0.45" />
        <rect x="2.5" y="2.5" width="17" height="8" rx="2" fill={color} />
        <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill={color} opacity="0.45" />
      </svg>
    </span>
  </div>
);
