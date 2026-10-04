/**
 * Every tunable number for the hero scene lives here.
 *
 * The artwork is a set of full frame 16:9 pictures with a locked camera, so
 * "animation" means crossfading whole frames. Nothing outside this file should
 * know a file name, a duration or a rate.
 *
 * Phases, in order, driven by the battery:
 *
 *   0 to 30%   deep sleep   (Phase 0)
 *  30 to 60%   light sleep  (Phase 1)
 *  60 to 90%   thinking     (Phase 2) alternating chin and pen poses
 *  90 to 100%  thinking, excited finale
 *  100%        wraps back to Phase 0
 *
 * TODO(phase3): 100 to 0% will be Coding, and the wrap at the bottom of
 * useSceneController is where that loop starts.
 */

/* ------------------------------------------------------------------ types */

export type Phase = "deepSleep" | "lightSleep" | "thinking";

/** Which cheek she is sleeping on. Only deep sleep ever turns over. */
export type Facing = "sideA" | "sideB";

/**
 * One full frame picture. Every key here is mounted for the life of the page and
 * shown by switching opacity, so the set doubles as the preload list.
 */
export const frames = {
  /** The empty desk. Also the fallback when any other file fails to load. */
  base: "bg_desk.png",

  /* Phase 0: deep sleep, both cheeks. */
  p0_breathAUp: "phase0_girl_sleep_1up.png",
  p0_breathADown: "phase0_girl_sleep_1down.png",
  p0_breathBUp: "phase0_girl_sleep_otherside_up.png",
  p0_breathBDown: "phase0_girl_sleep_otherside_down.png",
  p0_turn1: "phase0_girl_sleepturn_1.png",
  p0_turn2: "phase0_girl_sleepturn_2.png",

  /* Phase 1: light sleep, plus the stretch and the sleepy head up. */
  p1_sleepUp: "phase1_girl_sleep_up.png",
  p1_sleepDown: "phase1_girl_sleep_down.png",
  p1_stretchHalf: "phase1_girl_strech_half.png",
  p1_stretchFull: "phase1_girl_strech_full.png",
  p1_girlUp: "phase1_girlup_1.png",
  p1_girlNod: "phase1_girlup_2.png",

  /* Phase 2: thinking. */
  p2_chin1: "phase2_girl_chin_1.png",
  p2_chin2: "phase2_girl_chin_2.png",
  p2_pen1: "phase2_girl_pen_1.png",
  p2_pen2: "phase2_girl_pen_2.png",
  p2_halfLean: "phase2_girl_1_half_lean.png",
  p2_fullLean1: "phase2_girl_2_full_lean1.png",
  p2_fullLean2: "phase2_girl_2_full_lean2.png",
} as const;

export type FrameKey = keyof typeof frames;

/**
 * The "Loading" screens.
 *
 * These are NOT full frames: they were generated from the empty desk, so they do
 * not contain the girl, and the thinking frames already show the monitors
 * themselves. They are deliberately unused. If a future phase ever needs to
 * repaint the screens, it has to clip them to the screen rectangles rather than
 * mounting them behind her.
 */
export const unusedScreenFrames = {
  loading1: "screens_loading_1.png",
  loading2: "screens_loading_2.png",
} as const;

/** Screens showing code. Unused until Phase 3. */
export const codeScreenFrames = {
  code1: "screens_code_1.png",
  code2: "screens_code_2.png",
} as const;

export const allFrames = Object.keys(frames) as FrameKey[];

/** In public/scene. */
export function frameUrl(key: FrameKey): string {
  return `/scene/${frames[key]}`;
}

/**
 * Pairs that must be played in order rather than chosen by name.
 *
 * `turn` is the roll over onto the other cheek, and is also played backwards to
 * roll back, so it has to stay "start of turn, end of turn". `wake` is the head
 * going up and the sleepy nod that follows it.
 */
export const FRAME_ORDER = {
  turn: ["p0_turn1", "p0_turn2"] as const,
  wake: ["p1_girlUp", "p1_girlNod"] as const,
};

/* ------------------------------------------------------------------ phases */

export const phaseLabels: Record<Phase, string> = {
  deepSleep: "Deep Sleep",
  lightSleep: "Light Sleep",
  thinking: "Thinking",
};

export function phaseLabel(phase: Phase): string {
  return phaseLabels[phase];
}

/** Which phase a battery percentage belongs to. */
export function phaseFromBattery(percent: number): Phase {
  if (percent < sceneConfig.battery.deepSleepEndsAt) return "deepSleep";
  if (percent < sceneConfig.battery.lightSleepEndsAt) return "lightSleep";
  return "thinking";
}

/* ------------------------------------------------------------------- scene */

export const sceneConfig = {
  /**
   * The battery is the clock. Each segment is a percentage range with a duration,
   * so the rate is derived rather than written twice:
   *
   *   0 to 30   in 60s   0.5%/s
   *  30 to 60   in 60s   0.5%/s
   *  60 to 90   in 45s   ~0.667%/s
   *  90 to 100  in 20s   0.5%/s   the finale, which has to land on 100 exactly
   *
   * The last segment is driven by the finale sequence rather than by free
   * running charge, so it is only a fallback here.
   */
  battery: {
    /** Where a fresh page load starts. */
    startPercent: 0,
    /** What 100% wraps back to. */
    wrapToPercent: 0,
    /** Top of the bar. Also where the loop back to Phase 0 happens. */
    fullPercent: 100,

    deepSleepEndsAt: 30,
    lightSleepEndsAt: 60,

    /** The excited finale takes over here and holds her attention. */
    finaleAtPercent: 90,

    segments: [
      { from: 0, to: 30, ms: 60_000 },
      { from: 30, to: 60, ms: 60_000 },
      { from: 60, to: 90, ms: 45_000 },
      { from: 90, to: 100, ms: 20_000 },
    ] as { from: number; to: number; ms: number }[],
  },

  timing: {
    /** Frame delta clamp. A backgrounded tab must not jump the clock. */
    maxDeltaMs: 100,
    /** Fade in once the frames are preloaded. */
    startFadeMs: 600,
    /** Crossfade used when a phase changes with no reaction to play. */
    phaseChangeFadeMs: 700,
  },

  preload: {
    /** Never hold the scene hostage to a slow connection. */
    timeoutMs: 6000,
  },

  /** Idle breathing, per sleeping phase. */
  breathing: {
    deep: {
      startFrame: "p0_breathAUp",
      nextFrame: "p0_breathADown",
      holdMs: 3400,
      fadeMs: 500,
    },
    light: {
      startFrame: "p1_sleepUp",
      nextFrame: "p1_sleepDown",
      holdMs: 3800,
      fadeMs: 500,
    },
  },

  /** Phase 0 click: roll onto the other cheek. */
  turnReaction: {
    transitionHoldMs: 420,
    transitionFadeMs: 260,
    /** How long she stays rolled over before the click is forgotten. */
    afterTurnMs: 2600,
    breathingFadeMs: 500,
  },

  /** Phase 1: the one stretch, played once per visit to the phase. */
  stretch: {
    triggerAtPercent: 46,
    halfMs: 700,
    fullMs: 1100,
    fadeMs: 420,
  },

  /** Phase 1 click: head up, a sleepy nod, back down. */
  wakeReaction: {
    up1Ms: 900,
    nodMs: 700,
    backMs: 800,
    fadeMs: 340,
  },

  /**
   * Phase 2: thinking.
   *
   * Entering the phase wakes her through the Phase 1 head up frame, then hands
   * over to `poses`. Each pose holds for `poseMs` and alternates its two frames
   * every `frameHoldMs`; moving between poses is the slower `poseChangeFadeMs`.
   */
  thinking: {
    enter: {
      frame: "p1_girlUp",
      holdMs: 1000,
      fadeMs: 700,
      /** Crossfade into the first thinking pose. */
      poseFadeMs: 700,
    },

    /** The loop. Repeats until the battery reaches finaleAtPercent. */
    poses: [
      {
        name: "chin",
        frames: ["p2_chin1", "p2_chin2"],
        /** How long the whole pose lasts before moving on. */
        poseMs: 10_000,
        /** How long each of the two frames is held. */
        frameHoldMs: 1000,
        /** Crossfade between the two frames of the pair. */
        fadeMs: 250,
      },
      {
        name: "pen",
        frames: ["p2_pen1", "p2_pen2"],
        poseMs: 10_000,
        frameHoldMs: 1000,
        fadeMs: 250,
      },
    ] as {
      name: string;
      frames: readonly [FrameKey, FrameKey];
      poseMs: number;
      frameHoldMs: number;
      fadeMs: number;
    }[],

    /** The slower crossfade used when the pose itself changes. */
    poseChangeFadeMs: 600,

    /** Click during the loop: "I think I got an idea!". */
    reaction: {
      halfLeanMs: 600,
      /** Full lean, alternating the two frames. */
      fullLeanMs: 6000,
      /** Back through the half lean on the way to the interrupted pose. */
      halfLeanBackMs: 600,
      fadeMs: 320,
      /** How long the bubble stays up. */
      dialogueMs: 4000,
      dialogue: "I think I got an idea!",
    },

    /** 90 to 100%: the same idea, but now she cannot sit still. */
    finale: {
      halfLeanMs: 600,
      /**
       * Exactly the length of the 90 to 100 battery segment, so the bar reaches
       * 100 on the last frame of the lean rather than before or after it.
       */
      fullLeanMs: 20_000,
      fadeMs: 320,
      dialogueMs: 5000,
      dialogue: "I'm excited to implement this idea!",
    },

    /**
     * Reduced motion keeps the poses but drops the one second frame swaps, so she
     * changes pose every ten seconds instead of flickering between two frames
     * every second. The same goes for the full lean, which is a held pose rather
     * than a movement once the swap is gone.
     */
    reducedMotion: {
      /** Ignore frameHoldMs and hold the first frame of each pose. */
      skipAlternation: true,
      /** Ignore frameHoldMs in the click reaction and the finale too. */
      skipLeanAlternation: true,
    },
  },

  /**
   * Where her head is, as a percentage of the artwork. Drives the z letters.
   * Measured off the sleeping frames; side B is the same head rolled over.
   */
  zLetters: {
    enabled: true,
    cycleMs: 3600,
    positions: {
      sideA: { x: 66.5, y: 49 },
      sideB: { x: 73.5, y: 49 },
    },
    letters: [
      { char: "z", sizeEm: 0.85, delayMs: 0 },
      { char: "Z", sizeEm: 1.15, delayMs: 1100 },
      { char: "z", sizeEm: 0.7, delayMs: 2200 },
    ],
  },

  /**
   * Restricts the click target to one rectangle. Null means the whole scene is
   * clickable, which is what Phase 2 wants: "click her" is really "click the
   * picture".
   */
  hotspot: null as { x: number; y: number; width: number; height: number } | null,

  labels: {
    scene: "Tap the scene to wake her",
  },

  reducedMotion: {
    /** Longest crossfade allowed when the preference is on. */
    maxFadeMs: 120,
    /** No idle breathing. Poses still change, on their own schedule. */
    disableBreathing: true,
  },
} as const;

/** Percentage per second for whichever segment the battery is inside. */
export function batteryRateAt(percent: number): number {
  for (const segment of sceneConfig.battery.segments) {
    if (percent >= segment.from && percent < segment.to) {
      return ((segment.to - segment.from) / segment.ms) * 1000;
    }
  }
  return 0;
}