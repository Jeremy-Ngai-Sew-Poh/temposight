import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Award, Calendar, BarChart3, Activity, Minus } from "lucide-react";
import { PracticeSession } from "../App";

interface PerformanceTrendChartProps {
  history: PracticeSession[];
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  history,
}) => {
  // Take up to last 10 practice sessions (reverse to display oldest to newest left-to-right)
  const recentSessions = useMemo(() => history.slice(0, 10).reverse(), [history]);

  // Format data for Recharts with unique keys combining date and time
  const chartData = useMemo(() => {
    return recentSessions.map((session, index) => {
      const dateObj = new Date(session.timestamp);
      const isValidDate = !isNaN(dateObj.getTime());
      const shortDate = isValidDate
        ? dateObj.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "Session";
      const timeStr = isValidDate
        ? dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const fullDate = timeStr ? `${shortDate}, ${timeStr}` : shortDate;

      return {
        id: session.id || `session-${index}`,
        sessionNum: `Session ${index + 1}`,
        dateLabel: shortDate,
        timeLabel: timeStr,
        fullDate,
        // Unique X-axis key combining full date, time, and session ID to prevent Recharts collision
        xAxisKey: `${fullDate}::${session.id || index}`,
        score: session.score,
        sheetName: session.sheetName || "Custom Sheet",
        difficulty: session.difficulty,
      };
    });
  }, [recentSessions]);

  // Calculate statistics & trend trajectory
  const { avgScore, bestScore, latestScore, trendType, trendDelta, trendTheme } = useMemo(() => {
    const scores = recentSessions.map((s) => s.score);
    const count = scores.length;
    if (count === 0) {
      return {
        avgScore: 0,
        bestScore: 0,
        latestScore: 0,
        trendType: "neutral" as const,
        trendDelta: 0,
        trendTheme: {
          name: "Neutral",
          stroke: "#141414",
          gradientStart: "rgba(20, 20, 20, 0.25)",
          gradientEnd: "rgba(20, 20, 20, 0.0)",
          dotFill: "#141414",
          pillBg: "bg-black/5 text-[#141414] border-black/10",
          icon: Activity,
          iconColor: "text-[#141414]",
          labelText: "No Sessions",
        },
      };
    }

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / count);
    const best = Math.max(...scores);
    const latest = scores[count - 1];
    const oldest = scores[0];

    // Determine trend based on score progression
    let type: "improving" | "declining" | "steady" = "steady";
    let delta = 0;

    if (count === 1) {
      if (latest >= 80) type = "improving";
      else if (latest >= 65) type = "steady";
      else type = "declining";
      delta = 0;
    } else {
      delta = latest - oldest;
      const recentStep = latest - scores[count - 2];
      
      if (delta > 0 || (delta === 0 && recentStep > 0) || (latest >= avg && recentStep >= 0 && delta >= 0)) {
        type = "improving";
      } else if (delta < 0 || (delta === 0 && recentStep < 0) || (latest < avg && recentStep < 0)) {
        type = "declining";
      } else {
        type = "steady";
      }
    }

    const themeMap = {
      improving: {
        name: "Improving",
        stroke: "#059669", // Emerald 600
        gradientStart: "rgba(16, 185, 129, 0.35)", // Emerald 500
        gradientEnd: "rgba(16, 185, 129, 0.0)",
        dotFill: "#047857",
        pillBg: "bg-emerald-500/15 text-emerald-900 border-emerald-500/30",
        icon: TrendingUp,
        iconColor: "text-emerald-700",
        labelText: count > 1 ? `${delta > 0 ? `+${delta}` : delta} PTS • IMPROVING` : "SOLID BASELINE",
      },
      declining: {
        name: "Needs Focus",
        stroke: "#e11d48", // Rose 600
        gradientStart: "rgba(244, 63, 94, 0.35)", // Rose 500
        gradientEnd: "rgba(244, 63, 94, 0.0)",
        dotFill: "#be123c",
        pillBg: "bg-rose-500/15 text-rose-900 border-rose-500/30",
        icon: TrendingDown,
        iconColor: "text-rose-700",
        labelText: count > 1 ? `${delta} PTS • ATTENTION NEEDED` : "NEEDS PRACTICE",
      },
      steady: {
        name: "Steady",
        stroke: "#0284c7", // Sky 600
        gradientStart: "rgba(14, 165, 233, 0.30)", // Sky 500
        gradientEnd: "rgba(14, 165, 233, 0.0)",
        dotFill: "#0369a1",
        pillBg: "bg-sky-500/15 text-sky-900 border-sky-500/30",
        icon: Minus,
        iconColor: "text-sky-700",
        labelText: "0 PTS • STEADY PACE",
      },
      neutral: {
        name: "Neutral",
        stroke: "#141414",
        gradientStart: "rgba(20, 20, 20, 0.25)",
        gradientEnd: "rgba(20, 20, 20, 0.0)",
        dotFill: "#141414",
        pillBg: "bg-black/5 text-[#141414] border-black/10",
        icon: Activity,
        iconColor: "text-[#141414]",
        labelText: "No Sessions",
      },
    };

    return {
      avgScore: avg,
      bestScore: best,
      latestScore: latest,
      trendType: type,
      trendDelta: delta,
      trendTheme: themeMap[type],
    };
  }, [recentSessions]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const scoreVal = typeof data?.score === "number" ? data.score : Number(payload[0]?.value ?? 0);
      const getScoreBadgeColor = (val: number) => {
        if (val >= 85) return "bg-emerald-800 text-emerald-100 border-emerald-600";
        if (val >= 70) return "bg-amber-800 text-amber-100 border-amber-600";
        return "bg-rose-800 text-rose-100 border-rose-600";
      };

      return (
        <div className="liquid-glass-dark text-white p-3.5 rounded-2xl max-w-xs space-y-2 z-50 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] text-white font-semibold tracking-wide">
                {data.fullDate || data.dateLabel}
              </span>
              <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider">
                {data.sessionNum}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border ${getScoreBadgeColor(
                scoreVal
              )}`}
            >
              {data.difficulty || "Session"}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono opacity-70 block truncate max-w-[200px]">
              {data.sheetName}
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-serif font-bold text-white">
                {scoreVal}
              </span>
              <span className="text-xs font-mono text-white/60">/ 100 PTS</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dot Renderer to highlight Personal Best and Step Performance
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (typeof cx !== "number" || typeof cy !== "number") return null;
    const isBest = payload.score === bestScore;
    const isLatest = index === chartData.length - 1;
    const prevScore = index > 0 ? chartData[index - 1].score : payload.score;
    const isStepUp = payload.score > prevScore;
    const isStepDown = payload.score < prevScore;

    // Per-dot accent color
    const dotColor = isBest
      ? "#059669"
      : isStepUp
      ? "#10b981"
      : isStepDown
      ? "#f43f5e"
      : trendTheme.stroke;

    return (
      <g key={`trend-dot-${index}`}>
        {isLatest && (
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill={trendTheme.stroke}
            opacity={0.2}
          />
        )}
        {isBest && (
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="none"
            stroke="#059669"
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isBest || isLatest ? 5 : 4}
          fill={dotColor}
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  };

  const TrendIcon = trendTheme.icon;

  return (
    <div className="liquid-glass-panel p-5 sm:p-6 rounded-3xl space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/20 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shadow-2xs ${trendTheme.pillBg}`}>
              <TrendIcon className={`w-3.5 h-3.5 ${trendTheme.iconColor}`} />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#141414]">
              Performance Score Trend
            </h3>
            {recentSessions.length > 0 && (
              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${trendTheme.pillBg}`}>
                {trendTheme.labelText}
              </span>
            )}
          </div>
          <p className="text-xs text-[#141414]/70 font-sans mt-1">
            Historical evaluation analytics across your last {recentSessions.length}{" "}
            {recentSessions.length === 1 ? "session" : "sessions"}
          </p>
        </div>

        {/* Quick KPI Stat Pill */}
        {recentSessions.length > 0 && (
          <div className="flex items-center gap-3 bg-white/50 border border-white/80 p-2 px-3.5 rounded-2xl shadow-2xs">
            <div className="text-center px-1">
              <span className="text-[9px] font-mono uppercase opacity-60 block font-bold">
                Latest
              </span>
              <span className={`text-base font-serif font-bold ${
                trendType === "improving" ? "text-emerald-800" : trendType === "declining" ? "text-rose-800" : "text-[#141414]"
              }`}>
                {latestScore}
              </span>
            </div>
            <div className="w-px h-6 bg-[#141414]/15" />
            <div className="text-center px-1">
              <span className="text-[9px] font-mono uppercase opacity-60 block font-bold">
                Average
              </span>
              <span className="text-base font-serif font-bold text-[#141414]">
                {avgScore}
              </span>
            </div>
            <div className="w-px h-6 bg-[#141414]/15" />
            <div className="text-center px-1">
              <span className="text-[9px] font-mono uppercase opacity-60 block font-bold">
                Personal Best
              </span>
              <span className="text-base font-serif font-bold text-emerald-800">
                {bestScore}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Trend Badge */}
      {recentSessions.length > 0 && (
        <div className="sm:hidden flex items-center justify-between px-1">
          <span className="text-[11px] font-mono text-[#141414]/60 uppercase font-semibold">
            Trajectory Status
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${trendTheme.pillBg}`}>
            {trendTheme.labelText}
          </span>
        </div>
      )}

      {/* Recharts Area Chart Workspace */}
      {recentSessions.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-white/20 border border-dashed border-[#141414]/20 rounded-xl p-6">
          <BarChart3 className="w-8 h-8 text-[#141414]/40" />
          <div className="max-w-xs space-y-1">
            <span className="font-serif font-bold text-[#141414] text-sm block">
              No Practice Trend Data Yet
            </span>
            <p className="text-xs text-[#141414]/70 font-sans">
              Run sight-reading evaluations on sheet music scores to populate your progress curve over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full h-64 sm:h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 15, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendTheme.stroke} stopOpacity={0.32} />
                  <stop offset="60%" stopColor={trendTheme.stroke} stopOpacity={0.08} />
                  <stop offset="95%" stopColor={trendTheme.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#141414"
                strokeOpacity={0.1}
              />

              <XAxis
                dataKey="xAxisKey"
                tickLine={false}
                axisLine={{ stroke: "#141414", strokeOpacity: 0.2 }}
                tick={{ fill: "#141414", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(value: string) => {
                  if (!value) return "";
                  const fullDate = value.split("::")[0];
                  return fullDate;
                }}
                dy={6}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickLine={false}
                axisLine={{ stroke: "#141414", strokeOpacity: 0.2 }}
                tick={{ fill: "#141414", fontSize: 11, fontFamily: "monospace" }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="score"
                stroke={trendTheme.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreTrendGradient)"
                activeDot={{
                  r: 6,
                  fill: trendTheme.stroke,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                dot={renderCustomDot}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

