"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Scene.module.scss";
import { ZLetters } from "@/components/ZLetters";
import { Dialogue } from "@/components/Dialogue";
import { allFrames, frameUrl, sceneConfig, type Facing, type FrameKey } from "@/config/scene";
import { dialogueAnchors, dialogueTails } from "@/config/dialogue";
import type { Activity, Dialogue as DialogueLine, LoadStatus } from "@/hooks/useSceneController";

type SceneProps = {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  frame: FrameKey;
  fadeMs: number;
  facing: Facing;
  activity: Activity;
  ready: boolean;
  reducedMotion: boolean;
  debug: boolean;
  loads: Record<FrameKey, LoadStatus>;
  dialogue: DialogueLine | null;
  onActivate: () => void;
};

export function Scene({
  sceneRef,
  frame,
  fadeMs,
  facing,
  activity,
  ready,
  reducedMotion,
  debug,
  loads,
  dialogue,
  onActivate,
}: SceneProps) {
  const hotspot = sceneConfig.hotspot;
  const showLetters = sceneConfig.zLetters.enabled && !reducedMotion && activity === "breathing";

  /*
    The pose we are leaving keeps painting underneath the one coming in, instead
    of fading out alongside it. Crossfading two half transparent layers over a
    near black backdrop loses luminance at the midpoint, which reads as a black
    flash on every pose change: measured at 11.7% below average brightness. With
    an opaque layer underneath there is always a full strength image on screen.
  */
  const [leaving, setLeaving] = useState<FrameKey | null>(null);
  const shown = useRef<FrameKey | null>(null);

  useEffect(() => {
    const previous = shown.current;
    shown.current = frame;
    if (previous === null || previous === frame) return;

    setLeaving(previous);
    const timer = window.setTimeout(() => setLeaving(null), fadeMs);
    return () => window.clearTimeout(timer);
  }, [frame, fadeMs]);

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      data-ready={ready}
      style={{ "--fade": `${fadeMs}ms` } as React.CSSProperties}
    >
      {/*
        Every frame stays mounted for the life of the page. Only opacity
        changes, so swapping poses never unmounts an image or shifts layout.
        They live in .artboard so that artwork percentages keep their meaning
        once the picture is cropped to cover a screen of any shape.
      */}
      <div className={styles.artboard}>
        {allFrames.map((key) => (
          // Plain <img> is deliberate: the frames must stay unoptimised and
          // pixel-identical so the stack cannot shift or rescale.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            className={styles.frame}
            src={frameUrl(key)}
            alt=""
            aria-hidden="true"
            data-active={key === frame}
            data-leaving={key === leaving || undefined}
            data-missing={loads[key] === "error" || undefined}
            decoding="async"
            draggable={false}
          />
        ))}

        <span className={styles.tint} aria-hidden="true" />

        {showLetters ? <ZLetters facing={facing} /> : null}

        {/*
          Inside .artboard on purpose: the bubble is anchored in artwork
          percentages so it stays over her head whether the artboard is cropped
          on a wide screen or zoomed 1.55x on a phone.
        */}
        {dialogue ? (
          <Dialogue
            key={dialogue.id}
            text={dialogue.text}
            anchor={dialogueAnchors[dialogue.anchor]}
            tail={dialogueTails[dialogue.anchor]}
            reducedMotion={reducedMotion}
          />
        ) : null}

        {hotspot ? (
          <button
            type="button"
            className={styles.hotspot}
            style={
              {
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
              } as React.CSSProperties
            }
            onClick={onActivate}
            aria-label={sceneConfig.labels.scene}
          />
        ) : (
          <button
            type="button"
            className={styles.stage}
            onClick={onActivate}
            aria-label={sceneConfig.labels.scene}
          />
        )}

        {debug && dialogue ? (
          <span
            className={styles.anchorDebug}
            style={{
              left: `${dialogueAnchors[dialogue.anchor].x}%`,
              top: `${dialogueAnchors[dialogue.anchor].y}%`,
            }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}