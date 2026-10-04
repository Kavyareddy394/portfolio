"use client";

import styles from "./DebugOverlay.module.scss";
import { frames, type FrameKey } from "@/config/scene";
import type { Activity } from "@/hooks/useSceneController";

type DebugOverlayProps = {
  battery: number;
  phase: string;
  activity: Activity;
  reacting: boolean;
  facing: string;
  frame: FrameKey;
  think: string;
  ready: boolean;
  paused: boolean;
  speed: number;
  missing: FrameKey[];
  onSetBattery: (percent: number) => void;
  onClick: () => void;
  onShowFinale: () => void;
  onSetSpeed: (multiplier: number) => void;
};

/*
  Phase boundaries are buttons rather than typed numbers because they are the
  values that are awkward to reach by hand: 59 sits just below the wake up, 60
  lands on it, and 89 sits just below the finale.
*/
const BATTERY_STOPS: { label: string; percent: number }[] = [
  { label: "0%", percent: 0 },
  { label: "29%", percent: 29 },
  { label: "44%", percent: 44 },
  { label: "59%", percent: 59 },
  { label: "60%", percent: 60 },
  { label: "89%", percent: 89 },
];

export function DebugOverlay({
  battery,
  phase,
  activity,
  reacting,
  facing,
  frame,
  think,
  ready,
  paused,
  speed,
  missing,
  onSetBattery,
  onClick,
  onShowFinale,
  onSetSpeed,
}: DebugOverlayProps) {
  return (
    <aside className={styles.overlay} aria-label="Scene debug controls">
      <p className={styles.title}>debug</p>

      <dl className={styles.stats}>
        <div>
          <dt>battery</dt>
          <dd>{battery.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>phase</dt>
          <dd>{phase}</dd>
        </div>
        <div>
          <dt>activity</dt>
          <dd>{activity}</dd>
        </div>
        <div>
          {/* Not the same as activity: a turn reports "breathing" on its last
              step while it is still playing. */}
          <dt>reaction</dt>
          <dd>{reacting ? "playing" : "idle"}</dd>
        </div>
        <div>
          {/* Phase 2 only: which movement of hers is running. */}
          <dt>think</dt>
          <dd>{think}</dd>
        </div>
        <div>
          <dt>facing</dt>
          <dd>{facing}</dd>
        </div>
        <div>
          <dt>frame</dt>
          <dd>{frame}</dd>
        </div>
        <div>
          <dt>speed</dt>
          <dd>{speed}x</dd>
        </div>
        <div>
          <dt>state</dt>
          <dd>
            {ready ? (paused ? "paused" : "running") : "preloading"}
          </dd>
        </div>
      </dl>

      {missing.length > 0 ? (
        <p className={styles.missing}>
          missing: {missing.map((key) => frames[key]).join(", ")}
        </p>
      ) : null}

      <div className={styles.buttons}>
        {BATTERY_STOPS.map((stop) => (
          <button key={stop.label} type="button" onClick={() => onSetBattery(stop.percent)}>
            {stop.label}
          </button>
        ))}
        <button type="button" onClick={onClick}>
          click
        </button>
        <button type="button" onClick={onShowFinale}>
          finale
        </button>
        <button type="button" onClick={() => onSetSpeed(speed === 1 ? 10 : 1)}>
          {speed === 1 ? "10x" : "1x"}
        </button>
      </div>
    </aside>
  );
}