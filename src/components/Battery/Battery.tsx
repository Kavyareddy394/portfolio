"use client";

import styles from "./Battery.module.scss";
import { sceneConfig } from "@/config/scene";

type BatteryProps = {
  percent: number;
  phaseLabel: string;
  charging: boolean;
  paused: boolean;
};

export function Battery({
  percent,
  phaseLabel,
  charging,
  paused,
}: BatteryProps) {
  const { battery } = sceneConfig;
  const clamped = Math.max(0, Math.min(percent, battery.fullPercent));
  const fill = (clamped / battery.fullPercent) * 100;

  // Every phase change gets a tick on the track, so the three phases read as
  // three parts of one charge rather than one long bar.
  const markers = [
    battery.deepSleepEndsAt,
    battery.lightSleepEndsAt,
    battery.finaleAtPercent,
  ].filter((value) => value > 0 && value < battery.fullPercent);

  return (
    <div className={styles.battery} data-charging={charging}>
      <div className={styles.head}>
        <span className={styles.label}>
          {phaseLabel}
          {charging ? (
            <span className={styles.bolt} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
            </span>
          ) : null}
        </span>

        <span className={styles.percent}>
          {Math.round(clamped)}
          <span className={styles.unit}>%</span>
        </span>
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-label={`Battery ${Math.round(clamped)} percent, ${phaseLabel}`}
        aria-valuemin={0}
        aria-valuemax={battery.fullPercent}
        aria-valuenow={Math.round(clamped)}
      >
        <span className={styles.fill} style={{ width: `${fill}%` }} />

        {markers.map((value) => (
          <span
            key={value}
            className={styles.marker}
            style={{ left: `${(value / battery.fullPercent) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className={styles.caption}>
        {paused ? "Paused" : charging ? "Charging while she rests" : "Idle"}
      </p>
    </div>
  );
}