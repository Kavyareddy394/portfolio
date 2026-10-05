/**
 * What she says, and where the bubble sits while she says it.
 *
 * Kept out of the components so the writing and the placement can be changed
 * without touching any behaviour.
 *
 * Deep sleep and light sleep pick a line at random and never repeat one back to
 * back, so clicking her repeatedly does not feel like a stuck record. Phase 2 is
 * different: it has fixed lines that belong to a specific movement, so those are
 * written inline in config/scene.ts and passed through with the line itself.
 */

import type { Phase } from "./scene";

/**
 * Where the bubble is pinned.
 *
 * x and y are a percentage of the artwork from the top left, which is what keeps
 * the bubble over her head on any screen shape. dx and dy are a pixel nudge
 * applied after that, for the last few pixels of tuning.
 *
 * The nudge exists because a percentage cannot express "5px". A percent of the
 * artboard is a different number of pixels on every screen: the board is about
 * 1080px tall on a 1920 desktop and 422px on a stacked phone, so 5px is 0.46% in
 * one case and 1.18% in the other. Anything measured in real pixels on the
 * monitor in front of you belongs in dx and dy instead.
 */
export type Anchor = {
  x: number;
  y: number;
  dx?: number;
  dy?: number;
};

/** Which way the tail points, so it always aims at her head. */
export type Tail = "down" | "up" | "left" | "right";

/**
 * Placement is in artwork percentages, the same coordinate system the z letters
 * use, so the bubble tracks her head on any screen shape instead of drifting off
 * the art when the 16:9 artboard gets cropped on a phone.
 *
 * An anchor is the point the tail tip lands on. For a "down" tail that is the
 * bottom middle of the bubble, so the bubble sits on its anchor rather than above
 * it, and the tail bridges the last fraction of an em down onto her.
 *
 * The percentages place the tail on the crown of her head. The pixel nudges are
 * the correction on top of that, and they are not all the same direction:
 *
 *   Sleeping sits a hair too high, so it comes down 5px. Her head is low in the
 *   frame while she sleeps and there is nothing above it but empty night, so a
 *   small nudge down is all that is wanted.
 *
 *   Thinking and coding sit ON her face, so they go up. The crown is level with
 *   the bubble's bottom edge in those poses, which means the bubble body covers
 *   the eyes and nose. Lifting it clear costs tens of pixels rather than a
 *   couple, because the tail has to stay pointed at her head while the bubble
 *   body climbs above the top of her skull.
 */
export const dialogueAnchors = {
  deepSleep: { x: 70, y: 55, dy: 5 },
  lightSleep: { x: 70, y: 55, dy: 5 },

  /* Phase 2, chin and pen: upright, same as sleeping but awake. */
  thinking: { x: 70, y: 55, dy: -46 },
  /* Phase 2, half lean and full lean: her head has dropped and gone back, so the
     crown is lower and the bubble only has to clear that much less. */
  thinkingLeaning: { x: 67, y: 61, dy: -34 },

  /*
    Phase 3, the click reaction. She has turned round to face the viewer, and the
    typing frames put her head between x 62 and x 67, y 43 to y 57, measured off
    the difference between the lookdown and lookup pairs. Anchored inside that
    range rather than at the top of it, so the bubble sits beside her rather than
    above her while the tail points up at her face. She is facing the viewer here,
    so there is no profile to tuck the bubble behind and it has to clear her head
    entirely: the largest lift of the set.
  */
  coding: { x: 64.5, y: 52, dy: -54 },
} as const satisfies Record<string, Anchor>;

export const dialogueTails = {
  deepSleep: "down",
  lightSleep: "down",
  thinking: "down",
  thinkingLeaning: "down",
  coding: "down",
} as const satisfies Record<string, Tail>;

export type AnchorKey = keyof typeof dialogueAnchors;

export const dialogueConfig = {
  /** Typewriter speed, per character. */
  typeMs: 32,

  /**
   * Time the bubble lingers once the line is fully typed. The deep sleep turn
   * runs for about 2.8s, so this keeps the bubble up for the whole movement
   * rather than vanishing while she is still rolling over.
   *
   * Phase 2 lines carry their own duration with the movement that owns them and
   * ignore this.
   */
  minHoldMs: 2000,

  /**
   * Cap on the bubble width, as a percentage of the scene box. Applied in
   * container units rather than a percentage of the bubble's own parent, because
   * that parent is a zero sized anchor point and percentages resolve to zero.
   */
  maxWidth: 78,

  /**
   * Global lift, in pixels, applied to every bubble after its anchor.
   *
   * The per-anchor dy in dialogueAnchors is a correction between poses: one pose
   * relative to the next. This is the trim they all share, so nudging the whole
   * bubble up a few pixels does not mean editing five anchors and re-deriving them
   * against each other afterwards.
   *
   * Subtracted rather than added, so a positive number always means up.
   */
  lift: 12,

  enterMs: 240,
  exitMs: 300,
} as const;

/** Total time a line should stay up, typing included. */
export function dialogueHoldMs(text: string): number {
  return text.length * dialogueConfig.typeMs + dialogueConfig.minHoldMs;
}

export const dialogueLines: Record<Phase, readonly string[]> = {
  /* 0 to 30%: deep sleep. She is annoyed, and wants you to go away. */
  deepSleep: [
    "Tsk... don't disturb me. I'm deep asleep.",
    "Mmf. Five more minutes. That's not a request.",
    "You clicked me. Filing that as an incident.",
    "...go away. The build can wait.",
    "Shh. Hibernating, not broken.",
    "I'm asleep. That's the whole trick.",
  ],

  /* 30 to 60%: light sleep. Drowsier, warmer, happy to keep resting. */
  lightSleep: [
    "I'm tired. Lemme sleep for a little while.",
    "Mmm... don't let anything reach production.",
    "Not tired. Conserving battery.",
    "I'll get up when the tests go green.",
    "Shh... recharging. Nothing's on fire.",
    "Five more minutes. Then five more.",
  ],

  /*
    60 to 100%: thinking. Only used if she is clicked outside the loop, for
    example straight after waking. Inside the loop the click plays a fixed line
    from config/scene.ts instead.
  */
  thinking: [
    "Hm. Give me a minute with this one.",
    "Something's not adding up...",
    "Wait. Wait. I've got it.",
    "Shh. Thinking is loud.",
  ],

  /*
    100 to 0%: coding. The click reaction plays a fixed line from
    config/scene.ts, because she only ever says one thing when you interrupt her.
    This is here so the record covers every phase.
  */
  coding: ["Shh... I'm busy!\nDon't DISTURB"],
};