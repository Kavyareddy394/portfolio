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

/** Where the bubble is pinned, as a percentage of the artwork from the top left. */
export type Anchor = {
  x: number;
  y: number;
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
 * The y values are lower than they used to be, which was the fix for the bubble
 * reading as too high. Anchoring on the crown of her head left the bubble in the
 * empty band above her; on a stacked phone that band is the strip above the nav
 * rather than anything worth spending the height on. Her sleeping head tops out at
 * about y 56, so 55 puts the bubble just above her, and the leaning poses sit
 * lower again. Verified with ?debug=1: the bubble's bottom edge measures y 55 on
 * every screen shape from 320x568 up to 1920x1080.
 */
export const dialogueAnchors = {
  deepSleep: { x: 70, y: 55 },
  lightSleep: { x: 70, y: 55 },

  /* Phase 2, chin and pen: upright, same as sleeping but awake. */
  thinking: { x: 70, y: 55 },
  /* Phase 2, half lean and full lean: her head has dropped and gone back. */
  thinkingLeaning: { x: 67, y: 61 },

  /*
    Phase 3, the click reaction. She has turned round to face the viewer, and the
    typing frames put her head between x 62 and x 67, y 43 to y 57, measured off
    the difference between the lookdown and lookup pairs. Anchored inside that
    range rather than at the top of it, so the bubble sits beside her rather than
    above her while the tail points up at her face.
  */
  coding: { x: 64.5, y: 52 },
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
  coding: ["Shh... I'm busy!"],
};