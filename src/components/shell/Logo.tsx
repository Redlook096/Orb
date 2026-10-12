export const Logo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative size-8 shrink-0">
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,#8b5cf6,#22d3ee,#f472b6,#8b5cf6)] blur-[6px] opacity-70" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_30%,#fff_0%,#c4b5fd_18%,#7c3aed_55%,#1e1b4b_100%)]" />
    </div>
    {compact ? null : (
      <span className="font-display text-[22px] font-black tracking-tight text-white">
        orb<span className="text-brand-400">.</span>
      </span>
    )}
  </div>
);
