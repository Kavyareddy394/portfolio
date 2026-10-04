"use client";

import styles from "./DebugOverlay.module.scss";
import { frames, phaseLabels, type FrameKey, type Phase } from "@/config/scene";
import type { Activity } from "@/hooks/useSceneController";

type DebugOverlayProps = {
  battery: number;
  phase: string;
  activity: Activity;
  reacting: boolean;
  facing: string;
  frame: FrameKey;
  think: string;
  code: string;
  ready: boolean;
  paused: boolean;
  speed: number;
  missing: FrameKey[];
  onSetBattery: (percent: number) => void;
  onClick: () => void;
  onShowFinale: () => void;
  onJumpTo: (phase: Phase) => void;
  onSetSpeed: (multiplier: number) => void;
};

/*
  Phase boundaries are buttons rather than typed numbers because they are the
  values that are awkward to reach by hand: 59 sits just below the wake up, 60
  lands on it, and 89 sits just below the finale.

  100 and 1 are here for coding, which runs the other way: 100 is the moment she
  starts typing and 1 is the last moment you can interrupt her before she passes
  out.
*/
const BATTERY_STOPS: { label: string; percent: number }[] = [
  { label: "100%", percent: 100 },
  { label: "89%", percent: 89 },
  { label: "60%", percent: 60 },
  { label: "59%", percent: 59 },
  { label: "44%", percent: 44 },
  { label: "29%", percent: 29 },
  { label: "20%", percent: 20 },
  { label: "1%", percent: 1 },
  { label: "0%", percent: 0 },
];

const PHASE_JUMPS = Object.keys(phaseLabels) as Phase[];

export function DebugOverlay({
  battery,
  phase,
  activity,
  reacting,
  facing,
  frame,
  think,
  code,
  ready,
  paused,
  speed,
  missing,
  onSetBattery,
  onClick,
  onShowFinale,
  onJumpTo,
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
          {/* Phase 3 only, same idea: walk in, typing, or the click. */}
          <dt>code</dt>
          <dd>{code}</dd>
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
      </div>

      {/*
        Phase jumps rather than battery stops, because each phase has an entrance
        worth watching: thinking wakes her up and coding walks her in from the half
        lean, neither of which a bare battery number would show.
      */}
      <div className={styles.buttons}>
        {PHASE_JUMPS.map((target) => (
          <button key={target} type="button" onClick={() => onJumpTo(target)}>
            {phaseLabels[target].toLowerCase()}
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