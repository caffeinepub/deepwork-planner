import { useCallback, useState } from "react";

const STORAGE_KEY = "bubble_positions_v1";

type Positions = Record<string, { x: number; y: number }>;

function load(): Positions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Positions;
  } catch {
    // ignore
  }
  return {};
}

function save(positions: Positions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // ignore
  }
}

export function useBubblePositions(): [
  positions: Positions,
  setPosition: (id: string, x: number, y: number) => void,
] {
  const [positions, setPositions] = useState<Positions>(load);

  const setPosition = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      save(next);
      return next;
    });
  }, []);

  return [positions, setPosition];
}
