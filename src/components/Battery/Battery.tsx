"use client";

import styles from "./Battery.module.scss";
import { sceneConfig } from "@/config/scene";

type BatteryProps = {
  percent: number;
  phaseLabel: string;
  charging: boolean;
  paused: boolean;
};

export function Battery({ percent, phaseLabel, charging, paused }: BatteryProps) {
  const { battery } = sceneConfig;
  const clamped = Math.max(0, Math.min(percent, battery.fullPercent));
  const at = (value: number) => (value / battery.fullPercent) * 100;

  // Every phase change gets a tick on the track, so the phases read as parts of
  // one charge rather than one long bar.
  const markers = [
    battery.deepSleepEndsAt,
    battery.lightSleepEndsAt,
    battery.finaleAtPercent,
  ].filter((value) => value > 0 && value < battery.fullPercent);

  /*
    The bar carries the number and nothing else.

    The phase name and a sentence about it used to live here, which made the
    panel a paragraph about deep sleep rather than a gauge. The terminal already
    reports the mode on its own status line, so it was the same fact twice, and
    in the vertical orientation it is a strip about 56px wide with no room for a
    sentence anyway.

    The phase name stays in the accessible name, where it costs no space and a
    screen reader still gets it.
  */
  const state = paused ? "paused" : charging ? "charging" : "draining";

  return (
    <div className={styles.battery} data-charging={charging}>
      <span className={styles.percent}>
        {Math.round(clamped)}
        <span className={styles.unit}>%</span>
      </span>

      <div
        className={styles.track}
        role="progressbar"
        aria-label={`Battery ${Math.round(clamped)} percent, ${phaseLabel}, ${state}`}
        aria-valuemin={0}
        aria-valuemax={battery.fullPercent}
        aria-valuenow={Math.round(clamped)}
      >
        <span
          className={styles.fill}
          style={{ "--at": `${at(clamped)}%` } as React.CSSProperties}
        />

        {markers.map((value) => (
          <span
            key={value}
            className={styles.marker}
            style={{ "--at": `${at(value)}%` } as React.CSSProperties}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
