import { ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Entity__3 } from "../backend.d.ts";
import { useBubblePositions } from "../hooks/useBubblePositions";

// ─── Category Config ────────────────────────────────────────────────

const CLUSTER_CENTERS: Record<string, { x: number; y: number }> = {
  Study: { x: 200, y: 200 },
  Coding: { x: 600, y: 150 },
  Health: { x: 1000, y: 200 },
  Career: { x: 300, y: 500 },
  Fitness: { x: 700, y: 500 },
  Other: { x: 1100, y: 500 },
};

const CATEGORY_COLORS: Record<
  string,
  { from: string; to: string; glow: string }
> = {
  Study: {
    from: "rgba(139,92,246,0.75)",
    to: "rgba(109,40,217,0.75)",
    glow: "rgba(139,92,246,0.55)",
  },
  Coding: {
    from: "rgba(59,130,246,0.75)",
    to: "rgba(8,145,178,0.75)",
    glow: "rgba(59,130,246,0.55)",
  },
  Health: {
    from: "rgba(16,185,129,0.75)",
    to: "rgba(13,148,136,0.75)",
    glow: "rgba(16,185,129,0.55)",
  },
  Career: {
    from: "rgba(245,158,11,0.75)",
    to: "rgba(234,88,12,0.75)",
    glow: "rgba(245,158,11,0.55)",
  },
  Fitness: {
    from: "rgba(244,63,94,0.75)",
    to: "rgba(236,72,153,0.75)",
    glow: "rgba(244,63,94,0.55)",
  },
  Other: {
    from: "rgba(100,116,139,0.75)",
    to: "rgba(63,63,70,0.75)",
    glow: "rgba(100,116,139,0.55)",
  },
};

function getCategoryColors(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}

function getBubbleSize(priority: string): number {
  if (priority === "High") return 120;
  if (priority === "Medium") return 90;
  return 65;
}

function seededRand(str: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return ((h >>> 1) / 0x7fffffff) * 2 - 1;
}

function computeDefault(
  goal: Entity__3,
  index: number,
): { x: number; y: number } {
  const cluster = CLUSTER_CENTERS[goal.category] ?? CLUSTER_CENTERS.Other;
  const seed = goal.id + String(index);
  const ox = seededRand(seed, 1) * 80;
  const oy = seededRand(seed, 2) * 80;
  return {
    x: Math.max(70, Math.min(1330, cluster.x + ox)),
    y: Math.max(70, Math.min(630, cluster.y + oy)),
  };
}

const SKELETON_SIZES = [120, 90, 90, 65, 65] as const;
const SKELETON_LEFT = [180, 520, 870, 280, 680] as const;
const SKELETON_TOP = [160, 130, 160, 420, 420] as const;
const SKELETON_LABELS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"] as const;

// ─── Types ──────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  goals: Entity__3[];
  getProgress: (id: string) => number;
  getMilestoneInfo: (goal: Entity__3) => { total: number; completed: number };
  onGoalClick: (goal: Entity__3) => void;
  activeFilter: string;
  loading?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────

export default function BubbleCanvas({
  goals,
  getProgress,
  getMilestoneInfo,
  onGoalClick,
  activeFilter,
  loading = false,
}: BubbleCanvasProps) {
  const [savedPositions, setPosition] = useBubblePositions();
  const [dragPositions, setDragPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.0);

  const dragRef = useRef<{
    goalId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
    hasDragged: boolean;
  } | null>(null);

  // Persist default positions for goals that don't have saved positions yet
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only runs when goals change
  useEffect(() => {
    goals.forEach((goal, i) => {
      if (!savedPositions[goal.id]) {
        const pos = computeDefault(goal, i);
        setPosition(goal.id, pos.x, pos.y);
      }
    });
  }, [goals]);

  function getPos(goal: Entity__3, index: number): { x: number; y: number } {
    return (
      dragPositions[goal.id] ??
      savedPositions[goal.id] ??
      computeDefault(goal, index)
    );
  }

  // ── Drag handlers ──
  function handleMouseDown(
    e: React.MouseEvent,
    goal: Entity__3,
    index: number,
  ) {
    e.preventDefault();
    const pos = getPos(goal, index);
    dragRef.current = {
      goalId: goal.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      hasDragged: false,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startMouseX) / zoom;
    const dy = (e.clientY - dragRef.current.startMouseY) / zoom;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasDragged = true;
    }
    const newX = Math.max(40, Math.min(1360, dragRef.current.startPosX + dx));
    const newY = Math.max(40, Math.min(660, dragRef.current.startPosY + dy));
    setDragPositions((prev) => ({
      ...prev,
      [dragRef.current!.goalId]: { x: newX, y: newY },
    }));
  }

  function handleMouseUp(_e: React.MouseEvent, goal?: Entity__3) {
    if (!dragRef.current) return;
    const wasDragging = dragRef.current.hasDragged;
    const goalId = dragRef.current.goalId;
    const pos = dragPositions[goalId];
    if (wasDragging && pos) {
      setPosition(goalId, pos.x, pos.y);
    } else if (!wasDragging && goal && goal.id === goalId) {
      onGoalClick(goal);
    }
    dragRef.current = null;
  }

  function handleCanvasMouseUp() {
    if (!dragRef.current) return;
    const pos = dragPositions[dragRef.current.goalId];
    if (pos) setPosition(dragRef.current.goalId, pos.x, pos.y);
    dragRef.current = null;
  }

  // ── Connection lines (same category pairs) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: getPos depends on savedPositions/dragPositions
  const connections = useMemo(() => {
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      key: string;
    }> = [];
    const visibleGoals =
      activeFilter === "All"
        ? goals
        : goals.filter((g) => g.category === activeFilter);

    for (let i = 0; i < visibleGoals.length; i++) {
      for (let j = i + 1; j < visibleGoals.length; j++) {
        const a = visibleGoals[i];
        const b = visibleGoals[j];
        if (a.category !== b.category) continue;
        const idxA = goals.indexOf(a);
        const idxB = goals.indexOf(b);
        const posA = getPos(a, idxA);
        const posB = getPos(b, idxB);
        lines.push({
          x1: posA.x,
          y1: posA.y,
          x2: posB.x,
          y2: posB.y,
          key: `${a.id}-${b.id}`,
        });
      }
    }
    return lines;
  }, [goals, savedPositions, dragPositions, activeFilter]);

  // ── Category cluster labels ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: getPos depends on savedPositions/dragPositions
  const clusterLabels = useMemo(() => {
    const byCategory: Record<string, { x: number; y: number }[]> = {};
    goals.forEach((goal, i) => {
      const pos = getPos(goal, i);
      if (!byCategory[goal.category]) byCategory[goal.category] = [];
      byCategory[goal.category].push(pos);
    });
    return Object.entries(byCategory).map(([cat, positions]) => {
      const cx = positions.reduce((s, p) => s + p.x, 0) / positions.length;
      const cy = positions.reduce((s, p) => s + p.y, 0) / positions.length + 80;
      return { cat, x: cx, y: cy };
    });
  }, [goals, savedPositions, dragPositions]);

  // ── Zoom controls ──
  const zoomIn = () => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="w-full h-[600px] rounded-2xl bg-[#0a0a0f] border border-white/5 relative overflow-hidden flex items-center justify-center">
        <div className="relative w-full h-full">
          {SKELETON_LABELS.map((label, i) => (
            <div
              key={label}
              className="absolute rounded-full bg-white/5 animate-pulse"
              style={{
                width: SKELETON_SIZES[i],
                height: SKELETON_SIZES[i],
                left: SKELETON_LEFT[i],
                top: SKELETON_TOP[i],
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (goals.length === 0) {
    return (
      <div
        className="w-full h-[600px] rounded-2xl bg-[#0a0a0f] border border-white/5 flex flex-col items-center justify-center gap-3"
        data-ocid="master_plan.goals.empty_state"
      >
        <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
          <span className="text-2xl">🌌</span>
        </div>
        <p className="text-sm text-white/30 tracking-wide">
          Add your first goal to start mapping your universe
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[600px] rounded-2xl bg-[#0a0a0f] border border-white/5 relative overflow-hidden select-none"
      style={{ cursor: dragRef.current ? "grabbing" : "default" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      data-ocid="master_plan.goals.list"
    >
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= 2.0}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
          data-ocid="master_plan.zoom_in.button"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= 0.5}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
          data-ocid="master_plan.zoom_out.button"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="text-center text-[10px] text-white/25 mt-0.5">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Virtual Canvas */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 700,
          left: "50%",
          top: "50%",
          marginLeft: -700,
          marginTop: -350,
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {/* SVG Connection Lines */}
        <svg
          width={1400}
          height={700}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {connections.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          ))}
        </svg>

        {/* Category Labels */}
        {clusterLabels.map(({ cat, x, y }) => (
          <div
            key={cat}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
            className="text-xs text-white/20 font-medium tracking-widest uppercase whitespace-nowrap"
          >
            {cat}
          </div>
        ))}

        {/* Bubbles */}
        {goals.map((goal, i) => {
          const pos = getPos(goal, i);
          const size = getBubbleSize(goal.priority);
          const colors = getCategoryColors(goal.category);
          const isFiltered =
            activeFilter !== "All" && goal.category !== activeFilter;
          const isHovered = hoveredId === goal.id;
          const progress = getProgress(goal.id);
          const ms = getMilestoneInfo(goal);
          const fontSize = size >= 120 ? "11px" : size >= 90 ? "10px" : "9px";

          return (
            <motion.div
              key={goal.id}
              data-ocid={`master_plan.goals.item.${i + 1}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isFiltered ? 0.2 : 1 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: "backOut" }}
              style={{
                position: "absolute",
                width: size,
                height: size,
                left: pos.x - size / 2,
                top: pos.y - size / 2,
                cursor: "grab",
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(e, goal, i)}
              onMouseUp={(e) => handleMouseUp(e, goal)}
              onMouseEnter={() => setHoveredId(goal.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Bubble */}
              <div
                className="rounded-full flex items-center justify-center transition-all duration-200 overflow-hidden"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 35% 35%, ${colors.from}, ${colors.to})`,
                  boxShadow: isHovered
                    ? `0 0 32px 8px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                    : `0 0 12px 2px ${colors.glow.replace("0.55", "0.25")}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span
                  className="text-white font-semibold text-center leading-tight px-2 line-clamp-2"
                  style={{ fontSize, maxWidth: size - 16 }}
                >
                  {goal.title}
                </span>
              </div>

              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    bottom: size + 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 50,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs text-white/80 space-y-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">Priority</span>
                    <span className="font-medium">{goal.priority}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  {ms.total > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/40">Milestones</span>
                      <span className="font-medium">
                        {ms.completed}/{ms.total}
                      </span>
                    </div>
                  )}
                  {/* Tooltip arrow */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -5,
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: 8,
                      height: 8,
                      background: "#1a1a2e",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      borderRight: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Vignette overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
