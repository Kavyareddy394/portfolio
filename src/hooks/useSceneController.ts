"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FRAME_ORDER,
  allFrames,
  batteryDrainRate,
  batteryRateAt,
  frameUrl,
  phaseFromBattery,
  phaseLabel,
  randomMs,
  sceneConfig,
  typingFrames,
  type Facing,
  type FrameKey,
  type HeadPosition,
  type Phase,
} from "@/config/scene";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useBrowserState, useInView } from "@/hooks/useBrowserState";
import { dialogueHoldMs, dialogueLines, type AnchorKey } from "@/config/dialogue";

/** What the girl is doing right now. Drives debug output and the z letters. */
export type Activity =
  | "breathing"
  | "turningToB"
  | "turningBack"
  | "stretching"
  | "waking"
  | "thinking"
  | "leaning"
  | "excited"
  | "typing"
  | "talking"
  | "shushing";

/** A line she is currently saying. `id` changes on every line. */
export type Dialogue = {
  id: number;
  text: string;
  /** Which configured placement to use, see config/dialogue.ts. */
  anchor: AnchorKey;
  /** Overrides the default hold, for lines tied to a movement. */
  holdMs?: number;
};

export type LoadStatus = "loading" | "ready" | "error";

/** One entry of a scripted reaction. */
type Step = {
  frame: FrameKey;
  /** How long this frame is held. */
  hold: number;
  /** Crossfade length when arriving at this frame. */
  fade: number;
  activity: Activity;
  facing: Facing;
};

/**
 * Which Phase 2 movement is running.
 *
 * `loop` is the idle chin and pen cycle. `reaction` is the click, `finale` the
 * excited stretch at the end of the charge. `enter` is the wake up.
 */
type ThinkMode = "off" | "enter" | "loop" | "reaction" | "finale";

/**
 * Which Phase 3 movement is running.
 *
 * `enter` is the half lean out of the finale, `loop` the typing, `reaction` the
 * click that turns her round.
 */
type CodeMode = "off" | "enter" | "loop" | "reaction";

/** Mutable simulation state. Lives in a ref, mirrored into React state. */
type Sim = {
  battery: number;
  phase: Phase;
  facing: Facing;
  activity: Activity;
  frame: FrameKey;
  fadeMs: number;
  seq: Step[] | null;
  index: number;
  stepElapsed: number;
  breathElapsed: number;
  breathUp: boolean;
  stretchDone: boolean;
  /** Set when a phase boundary is crossed mid-reaction. */
  pendingPhase: Phase | null;

  /* Phase 2. */
  think: ThinkMode;
  /** Index into sceneConfig.thinking.poses. */
  poseIndex: number;
  /** Which of the pose's two frames is up. */
  poseFrame: number;
  /** Time spent in the current pose. */
  poseElapsed: number;
  /** Time spent on the current frame of the pose. */
  poseFrameElapsed: number;
  /** The pose a click interrupted, so it can be resumed where it left off. */
  resume: {
    poseIndex: number;
    poseFrame: number;
    poseElapsed: number;
    poseFrameElapsed: number;
  } | null;

  /* Phase 3. */
  code: CodeMode;
  /** Which way her head is tilted. */
  head: HeadPosition;
  /** Which of the two hand frames is up. */
  hand: number;
  /** Time left on the current hand frame. */
  handElapsed: number;
  /** Time left on the current head position. */
  headElapsed: number;

  paused: boolean;
  speed: number;
  reducedMotion: boolean;
  ready: boolean;
};

export type SceneController = {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  battery: number;
  phase: Phase;
  phaseLabel: string;
  facing: Facing;
  activity: Activity;
  frame: FrameKey;
  fadeMs: number;
  /** True while a scripted reaction (turn, stretch, wake, lean) is playing. */
  reacting: boolean;
  charging: boolean;
  /** Phase 3 only: the bar is going down instead of up. */
  discharging: boolean;
  paused: boolean;
  ready: boolean;
  reducedMotion: boolean;
  speed: number;
  debug: boolean;
  loads: Record<FrameKey, LoadStatus>;
  missing: FrameKey[];
  dialogue: Dialogue | null;
  think: ThinkMode;
  code: CodeMode;
  click: (force?: boolean) => void;
  setBattery: (percent: number) => void;
  setSpeed: (multiplier: number) => void;
  /** Debug only: skip straight to the excited finale. */
  showFinale: () => void;
  /** Debug only: drop her straight into a phase. */
  jumpTo: (phase: Phase) => void;
};

export function useSceneController(): SceneController {
  const reducedMotion = usePrefersReducedMotion();
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const [loads, setLoads] = useState<Record<FrameKey, LoadStatus>>(() =>
    allFrames.reduce(
      (acc, key) => {
        acc[key] = "loading";
        return acc;
      },
      {} as Record<FrameKey, LoadStatus>,
    ),
  );
  const [ready, setReady] = useState(false);

  const sim = useRef<Sim>({
    battery: sceneConfig.battery.startPercent,
    phase: phaseFromBattery(sceneConfig.battery.startPercent),
    facing: "sideA",
    activity: "breathing",
    // bg_desk shows until the frames are preloaded.
    frame: "base",
    fadeMs: 0,
    seq: null,
    index: 0,
    stepElapsed: 0,
    breathElapsed: 0,
    breathUp: true,
    stretchDone: false,
    pendingPhase: null,
    think: "off",
    poseIndex: 0,
    poseFrame: 0,
    poseElapsed: 0,
    poseFrameElapsed: 0,
    resume: null,
    code: "off",
    head: sceneConfig.coding.enter.head,
    hand: 0,
    handElapsed: 0,
    headElapsed: 0,
    paused: true,
    speed: 1,
    reducedMotion: false,
    ready: false,
  });

  /*
    The mirrored view. Annotated rather than inferred because sceneConfig is
    `as const`, which would otherwise pin battery to the literal 0 and make every
    later assignment a type error.
  */
  const [view, setView] = useState<{
    battery: number;
    phase: Phase;
    facing: Facing;
    activity: Activity;
    frame: FrameKey;
    fadeMs: number;
    reacting: boolean;
    think: ThinkMode;
    code: CodeMode;
  }>({
    battery: sceneConfig.battery.startPercent,
    phase: phaseFromBattery(sceneConfig.battery.startPercent),
    facing: "sideA",
    activity: "breathing",
    frame: "base",
    fadeMs: 0,
    reacting: false,
    think: "off",
    code: "off",
  });

  /* ---------------------------------------------------------------- dialogue */

  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const dialogueTimer = useRef<number | null>(null);
  const dialogueSeq = useRef(0);
  // Index of the last line used in each phase, so the same sentence never lands
  // twice in a row and the writing does not feel like a stuck record.
  const lastLine = useRef<Record<Phase, number>>({
    deepSleep: -1,
    lightSleep: -1,
    thinking: -1,
    coding: -1,
  });

  /**
   * Shows a line and takes it down again.
   *
   * `holdMs` overrides the type-and-linger default, which is what the Phase 2
   * movements use: the bubble has to disappear while she is still leaning, not
   * whenever the typing happens to finish.
   *
   * `delayMs` holds the line back, so a bubble can be timed to the moment she
   * reaches the pose it belongs to rather than the moment the movement starts.
   */
  const say = useCallback(
    (text: string, anchor: AnchorKey, holdMs?: number, delayMs = 0) => {
      if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current);

      const open = () => {
        dialogueSeq.current += 1;
        setDialogue({ id: dialogueSeq.current, text, anchor, holdMs });
        dialogueTimer.current = window.setTimeout(() => {
          setDialogue(null);
          dialogueTimer.current = null;
        }, holdMs ?? dialogueHoldMs(text));
      };

      if (delayMs > 0) {
        dialogueTimer.current = window.setTimeout(open, delayMs);
      } else {
        open();
      }
    },
    [],
  );

  /** A random line for a phase, never the same one twice in a row. */
  const sayRandomLine = useCallback(
    (phase: Phase) => {
      const lines = dialogueLines[phase];

      let index = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && index === lastLine.current[phase]) {
        index = (index + 1) % lines.length;
      }
      lastLine.current[phase] = index;

      say(lines[index], phase);
    },
    [say],
  );

  // Do not leave a timer running if the page goes away mid sentence.
  useEffect(
    () => () => {
      if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current);
    },
    [],
  );

  /* ---------------------------------------------------------------- debug */

  // ?debug=1 turns on the overlay, ?speed=10 runs the clock ten times faster.
  const { hidden, search } = useBrowserState();
  const params = new URLSearchParams(search);
  const debug = params.get("debug") === "1";
  const searchSpeed = Number(params.get("speed"));
  const [speedOverride, setSpeedOverride] = useState<number | null>(null);
  const speed =
    speedOverride ??
    (Number.isFinite(searchSpeed) && searchSpeed > 0 ? searchSpeed : 1);

  useEffect(() => {
    sim.current.speed = speed;
  }, [speed]);

  /* -------------------------------------------------------------- preload */

  useEffect(() => {
    let settled = 0;
    const total = allFrames.length;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      sim.current.ready = true;
      setReady(true);
      const first = sceneConfig.breathing.deep.startFrame;
      sim.current.frame = first;
      setView((prev) => ({
        ...prev,
        frame: first,
        fadeMs: sceneConfig.timing.startFadeMs,
      }));
    };

    /*
      Every frame is preloaded before she moves, and a missing one falls back to
      bg_desk rather than holding up the scene.
    */
    const track = <T extends string>(
      keys: readonly T[],
      url: (key: T) => string,
      report: (key: T, ok: boolean) => void,
    ) => {
      for (const key of keys) {
        const img = new Image();
        const done = (ok: boolean) => {
          settled += 1;
          report(key, ok);
          if (settled === total) finish();
        };
        img.onload = () => done(img.naturalWidth > 0);
        img.onerror = () => done(false);
        img.src = url(key);
      }
    };

    track(allFrames, frameUrl, (key, ok) =>
      setLoads((prev) => ({ ...prev, [key]: ok ? "ready" : "error" })),
    );

    // Never hold the scene hostage to a missing file.
    const timer = window.setTimeout(finish, sceneConfig.preload.timeoutMs);

    return () => window.clearTimeout(timer);
  }, []);

  /* ----------------------------------------------------------- visibility */

  // The scene pauses when the tab is hidden or the hero scrolls out of view.
  const setVisible = useCallback((visible: boolean) => setInView(visible), []);
  useInView(sceneRef, setVisible);

  /* --------------------------------------------------------- state machine */

  const mirror = useCallback(() => {
    const s = sim.current;
    // One decimal keeps the battery bar smooth without re-rendering every frame.
    const battery = Math.round(s.battery * 10) / 10;
    /*
      "reacting" is tracked separately from activity on purpose. The last step of
      a turn already reports activity "breathing" while the sequence is still
      running, so activity alone cannot answer "is she busy?". Anything that
      needs to wait for her to settle, such as changing phase or jumping the
      battery in the debug overlay, has to watch this instead.
    */
    const reacting = s.seq !== null;
    setView((prev) =>
      prev.battery === battery &&
      prev.phase === s.phase &&
      prev.facing === s.facing &&
      prev.activity === s.activity &&
      prev.frame === s.frame &&
      prev.fadeMs === s.fadeMs &&
      prev.reacting === reacting &&
      prev.think === s.think &&
      prev.code === s.code
        ? prev
        : {
            battery,
            phase: s.phase,
            facing: s.facing,
            activity: s.activity,
            frame: s.frame,
            fadeMs: s.fadeMs,
            reacting,
            think: s.think,
            code: s.code,
          },
    );
  }, []);

  const breathingFor = useCallback(
    (phase: Phase) =>
      phase === "deepSleep" ? sceneConfig.breathing.deep : sceneConfig.breathing.light,
    [],
  );

  /** Swaps the visible frame. Falls back to bg_desk if that file is missing. */
  const showFrame = useCallback((frame: FrameKey, fade: number) => {
    const s = sim.current;
    s.frame = loads[frame] === "error" ? "base" : frame;
    s.fadeMs = s.reducedMotion
      ? Math.min(fade, sceneConfig.reducedMotion.maxFadeMs)
      : fade;
  }, [loads]);

  const startSequence = useCallback((steps: Step[]) => {
    const s = sim.current;
    s.seq = steps;
    s.index = 0;
    s.stepElapsed = 0;
    const first = steps[0];
    s.activity = first.activity;
    s.facing = first.facing;
    showFrame(first.frame, first.fade);
  }, [showFrame]);

  /**
   * Phase 0 click: roll over to the other cheek and stay there. A second click
   * rolls her back, so the caller passes whichever side she is NOT on.
   *
   * Only one pair of turn frames exists, so turning back plays the same two
   * frames in reverse order. That reads as the opposite motion, which is why
   * FRAME_ORDER.turn must stay in "start of turn, end of turn" order.
   */
  const turnSequence = useCallback((to: Facing): Step[] => {
    const cfg = sceneConfig.turnReaction;
    const order =
      to === "sideB" ? FRAME_ORDER.turn : [...FRAME_ORDER.turn].reverse();
    const turning: Activity = to === "sideB" ? "turningToB" : "turningBack";
    const settled: FrameKey = to === "sideB" ? "p0_breathBUp" : "p0_breathAUp";

    return [
      {
        frame: order[0],
        hold: cfg.transitionHoldMs,
        fade: cfg.transitionFadeMs,
        activity: turning,
        facing: sim.current.facing,
      },
      {
        frame: order[1],
        hold: cfg.transitionHoldMs,
        fade: cfg.transitionFadeMs,
        activity: turning,
        facing: to,
      },
      {
        frame: settled,
        hold: cfg.afterTurnMs,
        fade: cfg.breathingFadeMs,
        activity: "breathing",
        facing: to,
      },
    ];
  }, []);

  /** Phase 1: the single stretch. */
  const stretchSequence = useCallback((): Step[] => {
    const cfg = sceneConfig.stretch;
    return [
      {
        frame: "p1_stretchHalf",
        hold: cfg.halfMs,
        fade: cfg.fadeMs,
        activity: "stretching",
        facing: "sideA",
      },
      {
        frame: "p1_stretchFull",
        hold: cfg.fullMs,
        fade: cfg.fadeMs,
        activity: "stretching",
        facing: "sideA",
      },
      {
        frame: "p1_stretchHalf",
        hold: cfg.halfMs,
        fade: cfg.fadeMs,
        activity: "stretching",
        facing: "sideA",
      },
    ];
  }, []);

  /** Phase 1 click: head up, sleepy nod, back down. */
  const wakeSequence = useCallback((): Step[] => {
    const cfg = sceneConfig.wakeReaction;
    const [up, nod] = FRAME_ORDER.wake;

    return [
      { frame: up, hold: cfg.up1Ms, fade: cfg.fadeMs, activity: "waking", facing: "sideA" },
      { frame: nod, hold: cfg.nodMs, fade: cfg.fadeMs, activity: "waking", facing: "sideA" },
      { frame: up, hold: cfg.backMs, fade: cfg.fadeMs, activity: "waking", facing: "sideA" },
    ];
  }, []);

  /* ------------------------------------------------------- phase 2: think */

  const poses = sceneConfig.thinking.poses;

  /** The pose the loop is on, as a config entry. */
  const currentPose = useCallback(
    (index: number) => poses[index % poses.length],
    [poses],
  );

  /**
   * Half lean, then the full lean for a while, then back through the half lean.
   *
   * Shared by the click reaction and the finale because the movement is the
   * same, only the length and the line change.
   */
  const leanSequence = useCallback(
    (
      cfg: {
        halfLeanMs: number;
        fullLeanMs: number;
        halfLeanBackMs?: number;
        fadeMs: number;
        frameHoldMs: number;
      },
      activity: Activity,
      /** Frame to land on last. Omitted when the caller resumes the loop itself. */
      returnTo?: FrameKey,
    ): Step[] => {
      const s = sim.current;
      const leanSteps: Step[] = [
        {
          frame: "p2_halfLean",
          hold: cfg.halfLeanMs,
          fade: cfg.fadeMs,
          activity,
          facing: "sideA",
        },
      ];

      /*
        The full lean alternates its two frames. The step count comes from the
        requested duration divided by the frame hold, so a duration that is not
        a whole multiple still lands on time rather than overrunning.

        Reduced motion holds one frame for the whole lean instead. The alternation
        is a flicker between two nearly identical poses, so dropping it keeps the
        movement and its length while removing the part that actually moves.
      */
      const cycles = Math.max(1, Math.round(cfg.fullLeanMs / cfg.frameHoldMs));
      const still =
        s.reducedMotion && sceneConfig.thinking.reducedMotion.skipLeanAlternation;
      for (let i = 0; i < cycles; i += 1) {
        leanSteps.push({
          frame: still || i % 2 === 0 ? "p2_fullLean1" : "p2_fullLean2",
          hold: cfg.frameHoldMs,
          fade: cfg.fadeMs,
          activity,
          facing: "sideA",
        });
      }

      // Back out through the half lean, unless the caller resumes a pose itself.
      if (returnTo) {
        leanSteps.push({
          frame: "p2_halfLean",
          hold: cfg.halfLeanBackMs ?? cfg.halfLeanMs,
          fade: cfg.fadeMs,
          activity,
          facing: "sideA",
        });
        leanSteps.push({
          frame: returnTo,
          // Last step: it only has to outlast the crossfade into the pose.
          hold: 0,
          fade: sceneConfig.thinking.poseChangeFadeMs,
          activity: "thinking",
          facing: "sideA",
        });
      }

      return leanSteps;
    },
    [],
  );

  /** Click during the thinking loop: she gets an idea. */
  const startReaction = useCallback(() => {
    const s = sim.current;
    const cfg = sceneConfig.thinking.reaction;

    // Remember where the loop was so it can pick up exactly there.
    s.resume = {
      poseIndex: s.poseIndex,
      poseFrame: s.poseFrame,
      poseElapsed: s.poseElapsed,
      poseFrameElapsed: s.poseFrameElapsed,
    };
    s.think = "reaction";

    const pose = currentPose(s.poseIndex);
    startSequence(
      leanSequence(
        { ...cfg, frameHoldMs: sceneConfig.thinking.poses[0].frameHoldMs },
        "leaning",
        pose.frames[s.poseFrame],
      ),
    );
    // The bubble belongs to the full lean, so it waits out the half lean.
    say(cfg.dialogue, "thinkingLeaning", cfg.dialogueMs, cfg.halfLeanMs);
  }, [currentPose, leanSequence, say, startSequence]);

  /** 90 to 100%: the same idea, at full volume. */
  const startFinale = useCallback(() => {
    const s = sim.current;
    const cfg = sceneConfig.thinking.finale;

    s.think = "finale";
    s.resume = null;
    s.poseElapsed = 0;
    s.poseFrameElapsed = 0;
    s.activity = "excited";

    const each = poses[0].frameHoldMs;
    startSequence(leanSequence({ ...cfg, frameHoldMs: each }, "excited"));
    // Timed to the moment she is actually leaning, not to the moment she starts.
    say(cfg.dialogue, "thinkingLeaning", cfg.dialogueMs, cfg.halfLeanMs);
  }, [leanSequence, poses, say, startSequence]);

  /**
   * Waking up: the Phase 1 head up frame, held for a beat, then straight into
   * the first thinking pose.
   */
  const startThinkingEnter = useCallback(() => {
    const s = sim.current;
    const cfg = sceneConfig.thinking;
    const first = currentPose(0);

    s.think = "enter";
    s.poseIndex = 0;
    s.poseFrame = 0;
    s.poseElapsed = 0;
    s.poseFrameElapsed = 0;
    s.activity = "waking";

    startSequence([
      {
        frame: cfg.enter.frame as FrameKey,
        hold: cfg.enter.holdMs,
        fade: cfg.enter.fadeMs,
        activity: "waking",
        facing: "sideA",
      },
      {
        frame: first.frames[0],
        // The last step only has to last long enough for the crossfade; the
        // loop takes over the moment the sequence ends.
        hold: 0,
        fade: cfg.enter.poseFadeMs,
        activity: "thinking",
        facing: "sideA",
      },
    ]);
  }, [currentPose, startSequence]);

  /**
   * The thinking loop. A pose runs for its own duration and hands over to the
   * next one forever; the battery decides when the loop stops.
   */
  const thinkLoop = useCallback(
    (dt: number) => {
      const s = sim.current;
      const cfg = sceneConfig.thinking;
      const pose = currentPose(s.poseIndex);

      s.poseElapsed += dt;

      /*
        Reduced motion drops the one second alternation: the pose's first frame
        is held for the whole pose and only the pose changes. The poses
        themselves still change, so nothing sits frozen.
      */
      const alternates = !(s.reducedMotion && cfg.reducedMotion.skipAlternation);

      if (alternates) {
        s.poseFrameElapsed += dt;
        if (s.poseFrameElapsed >= pose.frameHoldMs) {
          s.poseFrameElapsed -= pose.frameHoldMs;
          s.poseFrame = s.poseFrame === 0 ? 1 : 0;
          showFrame(pose.frames[s.poseFrame], pose.fadeMs);
        }
      }

      if (s.poseElapsed < pose.poseMs) return;

      s.poseElapsed -= pose.poseMs;
      s.poseIndex = (s.poseIndex + 1) % poses.length;
      s.poseFrame = 0;
      s.poseFrameElapsed = 0;
      s.activity = "thinking";
      showFrame(currentPose(s.poseIndex).frames[0], cfg.poseChangeFadeMs);
    },
    [currentPose, poses.length, showFrame],
  );

  /* ------------------------------------------------------- phase 3: coding */

  /** The frame she is typing on: head position first, then which hand is down. */
  const typingFrame = useCallback(
    (head: HeadPosition, hand: number) => typingFrames[head][hand % 2],
    [],
  );

  /** Puts the typing loop on a fresh head position with a fresh random hold. */
  const resetHead = useCallback((head: HeadPosition) => {
    const s = sim.current;
    const cfg = sceneConfig.coding.typing;
    s.head = head;
    s.hand = 0;
    s.handElapsed = 0;
    s.headElapsed = randomMs(head === "down" ? cfg.downMs : cfg.upMs);
  }, []);

  /**
   * Out of the Phase 2 finale: the half lean, then straight to the keyboard.
   *
   * The half lean is the pose she was already in, so the finale does not have to
   * cut to a completely different picture before the typing starts.
   */
  const startCodingEnter = useCallback(() => {
    const s = sim.current;
    const cfg = sceneConfig.coding;

    s.code = "enter";
    s.think = "off";
    s.resume = null;
    s.pendingPhase = null;
    s.activity = "leaning";
    resetHead(cfg.enter.head);

    startSequence([
      {
        frame: "p2_halfLean",
        hold: cfg.enter.halfLeanMs,
        fade: cfg.enter.halfLeanFadeMs,
        activity: "leaning",
        facing: "sideA",
      },
      {
        frame: typingFrame(s.head, s.hand),
        // The last step only has to outlast the crossfade: the loop takes over
        // the moment the sequence ends.
        hold: 0,
        fade: cfg.enter.poseFadeMs,
        activity: "typing",
        facing: "sideA",
      },
    ]);
  }, [resetHead, startSequence, typingFrame]);

  /**
   * The typing loop.
   *
   * Two independent timers. The hands swap fast and are what make it read as
   * typing; the head swaps slowly and on a random hold, so she does not look like
   * she is metronomic.
   */
  const typingLoop = useCallback(
    (dt: number) => {
      const s = sim.current;
      const cfg = sceneConfig.coding.typing;

      if (!(s.reducedMotion && sceneConfig.coding.reducedMotion.skipHandAlternation)) {
        s.handElapsed += dt;
        if (s.handElapsed >= cfg.handMs) {
          s.handElapsed -= cfg.handMs;
          s.hand = s.hand === 0 ? 1 : 0;
          showFrame(typingFrame(s.head, s.hand), cfg.handFadeMs);
        }
      }

      s.headElapsed -= dt;
      if (s.headElapsed > 0) return;

      resetHead(s.head === "down" ? "up" : "down");
      s.activity = "typing";
      showFrame(typingFrame(s.head, s.hand), cfg.headFadeMs);
    },
    [resetHead, showFrame, typingFrame],
  );

  /** Click while typing: she stops, turns round, and tells you to be quiet. */
  const startCodeReaction = useCallback(() => {
    const s = sim.current;
    const cfg = sceneConfig.coding.reaction;

    s.code = "reaction";
    s.activity = "shushing";

    /*
      As many mouth frames as fit in the talk window. Rounded rather than
      truncated so the last one always gets its full hold: a window that is not a
      whole multiple still ends on time instead of clipping the final frame.
    */
    const talkFrameMs = s.reducedMotion
      ? sceneConfig.coding.reducedMotion.talkFrameMs
      : cfg.talkFrameMs;
    const mouths = Math.max(2, Math.round(cfg.talkMs / talkFrameMs));

    const steps: Step[] = [
      {
        frame: "p3_angryTurn",
        hold: cfg.turnMs,
        fade: cfg.turnFadeMs,
        activity: "shushing",
        facing: "sideA",
      },
    ];
    for (let i = 0; i < mouths; i += 1) {
      steps.push({
        frame: i % 2 === 0 ? "p3_angryTalk1" : "p3_angryTalk2",
        hold: talkFrameMs,
        fade: cfg.talkFadeMs,
        activity: "talking",
        facing: "sideA",
      });
    }
    steps.push({
      frame: "p3_angryTurn",
      hold: cfg.backTurnMs,
      fade: cfg.backFadeMs,
      activity: "shushing",
      facing: "sideA",
    });

    startSequence(steps);
    /*
      The bubble belongs to the talking, not to the turn, so it waits out the turn
      and comes down with the last mouth frame. Left to its own timings it would
      still be typing when she has stopped talking.
    */
    say(cfg.dialogue, "coding", cfg.talkMs, cfg.turnMs);
  }, [say, startSequence]);

  /**
   * Which phase the battery is asking for.
   *
   * phaseFromBattery only knows the four climbing ranges, which is not enough on
   * its own: coding runs the bar back down through every one of them, so a
   * draining battery reads as "thinking" one tick after it leaves 100% and she
   * would flip between the two phases once a second for the whole two minutes.
   *
   * So while she is coding the descent is hers, and only the bottom of it is a
   * boundary. Everywhere else the battery decides, which is what lets the debug
   * overlay drop her into a phase by moving the bar.
   */
  const nextPhase = useCallback((): Phase => {
    const s = sim.current;
    if (s.phase === "coding") {
      return s.battery <= 0 ? "deepSleep" : "coding";
    }
    return phaseFromBattery(s.battery);
  }, []);

  /** Phase 3: advance the typing loop unless a movement owns the frames. */
  const codingTick = useCallback(
    (dt: number) => {
      const s = sim.current;
      if (s.code === "reaction" || s.code === "enter") return;
      typingLoop(dt);
    },
    [typingLoop],
  );

  /**
   * The frame to rest on. Side B only has deep-sleep poses, so light sleep
   * always breathes on side A no matter which way she was facing.
   */
  const idleFrame = useCallback(
    (phase: Phase, up: boolean, facing: Facing): FrameKey => {
      if (phase === "deepSleep" && facing === "sideB") {
        return up ? "p0_breathBUp" : "p0_breathBDown";
      }
      const cfg = breathingFor(phase);
      return up ? cfg.startFrame : cfg.nextFrame;
    },
    [breathingFor],
  );

  /** Crossfades into a new phase. Called only when nothing else is running. */
  const applyPhase = useCallback(
    (next: Phase) => {
      const s = sim.current;
      const leaving = s.phase;
      s.phase = next;
      // The stretch plays once per phase.
      s.stretchDone = false;
      s.breathUp = true;
      s.breathElapsed = 0;
      // Light sleep has no side B poses, so entering a phase faces her forwards.
      s.facing = "sideA";
      s.activity = "breathing";
      s.think = "off";
      s.code = "off";
      s.resume = null;

      if (next === "thinking") {
        startThinkingEnter();
        return;
      }

      if (next === "coding") {
        startCodingEnter();
        return;
      }

      /*
        Falling out of coding is the end of the whole cycle rather than one phase
        change among several, so it gets the long way round: two minutes of
        coding fades back into a sleeping room over a second and a half.
      */
      const fade =
        leaving === "coding" && next === "deepSleep"
          ? sceneConfig.coding.exit.fadeMs
          : sceneConfig.timing.phaseChangeFadeMs;

      showFrame(idleFrame(next, true, s.facing), fade);
    },
    [idleFrame, showFrame, startCodingEnter, startThinkingEnter],
  );

  const endSequence = useCallback(() => {
    const s = sim.current;
    s.seq = null;
    s.index = 0;
    s.stepElapsed = 0;
    s.breathElapsed = 0;
    s.breathUp = true;
    // Facing is deliberately kept: after a turn she must keep breathing on
    // whichever cheek she rolled onto.

    /* Phase 2 movements hand control back to something of their own choosing. */
    if (s.phase === "thinking") {
      if (s.think === "enter") {
        s.think = "loop";
        s.activity = "thinking";
        s.poseIndex = 0;
        s.poseFrame = 0;
        s.poseElapsed = 0;
        s.poseFrameElapsed = 0;
        showFrame(currentPose(0).frames[0], sceneConfig.thinking.poseChangeFadeMs);
        return;
      }

      if (s.think === "reaction") {
        // Back to the pose the click interrupted, with the time it had left.
        const resume = s.resume;
        s.think = "loop";
        s.activity = "thinking";
        if (resume) {
          s.poseIndex = resume.poseIndex;
          s.poseFrame = resume.poseFrame;
          s.poseElapsed = resume.poseElapsed;
          s.poseFrameElapsed = resume.poseFrameElapsed;
        }
        s.resume = null;
        // If the charge reached the finale while she was leaning, go now rather
        // than on the next tick, so the twenty seconds start on this frame.
        if (s.battery >= sceneConfig.battery.finaleAtPercent) {
          startFinale();
          return;
        }
        return;
      }

      // The finale is over: the charge is done, so she goes to work.
      if (s.think === "finale") {
        s.battery = sceneConfig.battery.fullPercent;
        startCodingEnter();
        return;
      }

      /*
        Anything else means the sequence was cut short from outside, which only
        the debug overlay does. Hand the loop back on the frame she was already
        showing: falling through to the sleeping frame below would put her back
        to bed while the scene still says she is thinking.
      */
      s.think = "loop";
      s.activity = "thinking";
      s.resume = null;
      if (s.pendingPhase && s.pendingPhase !== s.phase) {
        applyPhase(s.pendingPhase);
        s.pendingPhase = null;
        return;
      }
      return;
    }

    /* Phase 3 movements. */
    if (s.phase === "coding") {
      // The half lean is over: hand the scene to the typing loop.
      if (s.code === "enter") {
        s.code = "loop";
        s.activity = "typing";
        showFrame(typingFrame(s.head, s.hand), sceneConfig.coding.enter.poseFadeMs);
        return;
      }

      if (s.code === "reaction") {
        /*
          The bar can empty while she is talking. She finishes the sentence
          first, because pendingPhase exists for exactly this: the boundary was
          crossed mid movement and waits for her to settle.
        */
        const next = s.pendingPhase;
        s.pendingPhase = null;
        s.code = "loop";
        s.activity = "typing";
        if (next && next !== s.phase) {
          applyPhase(next);
          return;
        }
        // Back to typing in the head position the click interrupted, on the hand
        // frame it happened to be showing.
        showFrame(typingFrame(s.head, s.hand), sceneConfig.coding.reaction.returnFadeMs);
        return;
      }

      // Cut short from outside, which only the debug overlay does. Back to the
      // typing loop on the frame she is already showing.
      s.code = "loop";
      s.activity = "typing";
      if (s.pendingPhase && s.pendingPhase !== s.phase) {
        const next = s.pendingPhase;
        s.pendingPhase = null;
        applyPhase(next);
        return;
      }
      showFrame(typingFrame(s.head, s.hand), sceneConfig.coding.typing.headFadeMs);
      return;
    }

    s.activity = "breathing";

    if (s.pendingPhase && s.pendingPhase !== s.phase) {
      applyPhase(s.pendingPhase);
      s.pendingPhase = null;
      return;
    }
    showFrame(idleFrame(s.phase, true, s.facing), breathingFor(s.phase).fadeMs);
  }, [
    applyPhase,
    breathingFor,
    currentPose,
    idleFrame,
    showFrame,
    startCodingEnter,
    startFinale,
    typingFrame,
  ]);

  const advanceSequence = useCallback(
    (dt: number) => {
      const s = sim.current;
      if (!s.seq) return;
      s.stepElapsed += dt;

      const current = s.seq[s.index];
      if (s.stepElapsed < current.hold) return;

      s.stepElapsed -= current.hold;
      s.index += 1;

      if (s.index >= s.seq.length) {
        endSequence();
        return;
      }

      const next = s.seq[s.index];
      s.activity = next.activity;
      s.facing = next.facing;
      showFrame(next.frame, next.fade);
    },
    [endSequence, showFrame],
  );

  const idleBreathing = useCallback(
    (dt: number) => {
      const s = sim.current;
      if (s.reducedMotion && sceneConfig.reducedMotion.disableBreathing) return;

      const cfg = breathingFor(s.phase);
      s.breathElapsed += dt;
      if (s.breathElapsed < cfg.holdMs) return;

      s.breathElapsed = 0;
      s.breathUp = !s.breathUp;
      showFrame(idleFrame(s.phase, s.breathUp, s.facing), cfg.fadeMs);
    },
    [breathingFor, idleFrame, showFrame],
  );

  const maybeStretch = useCallback(() => {
    const s = sim.current;
    if (s.phase !== "lightSleep") return;
    if (s.stretchDone) return;
    if (s.battery < sceneConfig.stretch.triggerAtPercent) return;

    s.stretchDone = true;
    startSequence(stretchSequence());
  }, [startSequence, stretchSequence]);

  /** Phase 2: advance the loop, the finale trigger and the loading overlay. */
  const thinkingTick = useCallback(
    (dt: number) => {
      const s = sim.current;

      // A movement in progress drives the frames; the battery keeps charging.
      if (s.think === "reaction" || s.think === "finale") return;

      if (s.think === "enter") return;

      if (s.battery >= sceneConfig.battery.finaleAtPercent) {
        startFinale();
        return;
      }

      thinkLoop(dt);
    },
    [startFinale, thinkLoop],
  );

  const tick = useCallback(
    (dt: number) => {
      const s = sim.current;
      const { battery } = sceneConfig;

      /*
        The charge always runs, even mid-movement: she is thinking harder, not
        charging less. Two things hold it back, so the timings in the config are
        the timings that actually happen.

        A click reaction that is still going when the bar reaches the finale
        waits at the mark, because the finale has to start from exactly 90%.

        The finale holds at the mark for its own half lean as well. The charge
        belongs to the full lean, and the full lean is what has to be exactly
        twenty seconds, so the bar is allowed to arrive at 100% at the moment
        the lean ends rather than part way through it.
      */
      const finaleEntering =
        s.phase === "thinking" &&
        s.think === "finale" &&
        s.seq !== null &&
        s.index === 0;
      const held =
        (s.phase === "thinking" && s.think === "reaction") || finaleEntering;
      const cap = held ? battery.finaleAtPercent : battery.fullPercent;

      /*
        Phase 3 drains, at one rate for the whole descent, and nothing holds the
        bar back while she does it: not even a click reaction. She keeps working
        through being interrupted, and a reaction still running when the bar
        empties is finished off at 0% before the scene moves on.
      */
      const coding = s.phase === "coding";
      const step = ((coding ? batteryDrainRate() : batteryRateAt(s.battery)) * dt) / 1000;

      s.battery = coding
        ? Math.max(0, s.battery - step)
        : Math.min(s.battery + step, cap);

      if (s.seq) {
        // A reaction in progress always wins: the boundary waits for it.
        const next = nextPhase();
        if (next !== s.phase) s.pendingPhase = next;
        advanceSequence(dt);
        mirror();
        return;
      }

      const next = nextPhase();
      if (next !== s.phase) {
        applyPhase(next);
      } else if (s.phase === "thinking") {
        thinkingTick(dt);
      } else if (s.phase === "coding") {
        codingTick(dt);
      } else {
        maybeStretch();
        if (!s.seq) idleBreathing(dt);
      }

      mirror();
    },
    [
      advanceSequence,
      applyPhase,
      codingTick,
      idleBreathing,
      maybeStretch,
      mirror,
      nextPhase,
      thinkingTick,
    ],
  );

  /* ------------------------------------------------------------ main loop */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const delta = Math.min(now - last, sceneConfig.timing.maxDeltaMs);
      last = now;
      const s = sim.current;
      if (!s.paused) tick(delta * s.speed);
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [tick]);

  /* ---------------------------------------------------------- pause rules */

  useEffect(() => {
    const s = sim.current;
    s.paused = hidden || !inView || !ready;
    s.reducedMotion = reducedMotion;
  }, [hidden, inView, ready, reducedMotion]);

  /* --------------------------------------------------------------- actions */

  const click = useCallback(
    (force = false) => {
      const s = sim.current;
      if (!force && (s.paused || !s.ready)) return;
      // One reaction at a time.
      if (s.seq) return;

      if (s.phase === "thinking") {
        // Only the idle loop answers a click: the wake up, the lean reaction and
        // the finale all ignore it.
        if (s.think !== "loop") return;
        startReaction();
        mirror();
        return;
      }

      if (s.phase === "coding") {
        // Only the typing loop answers, so a click landing during the walk in from
        // the finale, or during the reaction itself, is ignored.
        if (s.code !== "loop") return;
        startCodeReaction();
        mirror();
        return;
      }

      if (s.phase === "deepSleep") {
        // Toggle whichever cheek she is not currently sleeping on.
        sayRandomLine("deepSleep");
        startSequence(turnSequence(s.facing === "sideA" ? "sideB" : "sideA"));
      } else {
        sayRandomLine("lightSleep");
        startSequence(wakeSequence());
      }
      mirror();
    },
    [
      mirror,
      sayRandomLine,
      startCodeReaction,
      startReaction,
      startSequence,
      turnSequence,
      wakeSequence,
    ],
  );

  const setBattery = useCallback(
    (percent: number) => {
      const s = sim.current;
      s.battery = Math.max(
        0,
        Math.min(percent, sceneConfig.battery.fullPercent),
      );
      mirror();
    },
    [mirror],
  );

  const setSpeed = useCallback((multiplier: number) => {
    setSpeedOverride(multiplier);
  }, []);

  /** Debug only: drop her straight into the finale from wherever she is. */
  const showFinale = useCallback(() => {
    const s = sim.current;
    if (s.phase !== "thinking") {
      s.battery = sceneConfig.battery.finaleAtPercent;
      applyPhase("thinking");
    }
    // Drop whatever she was doing, then start the finale from a clean slate.
    s.seq = null;
    s.index = 0;
    s.stepElapsed = 0;
    s.battery = sceneConfig.battery.finaleAtPercent;
    startFinale();
    mirror();
  }, [applyPhase, mirror, startFinale]);

  /**
   * Debug only: put her in a phase.
   *
   * Sets the battery to the middle of that phase and then applies it, so the jump
   * goes through the same entrance the cycle does: jumping to thinking wakes her
   * up, jumping to coding walks her in from the half lean.
   */
  const jumpTo = useCallback(
    (phase: Phase) => {
      const s = sim.current;
      s.seq = null;
      s.index = 0;
      s.stepElapsed = 0;
      s.pendingPhase = null;
      s.battery = sceneConfig.debug.batteryForPhase[phase];
      applyPhase(phase);
      mirror();
    },
    [applyPhase, mirror],
  );

  const missing = useMemo(
    () => allFrames.filter((key) => loads[key] === "error"),
    [loads],
  );

  // Derived, never read off a ref during render.
  const paused = hidden || !inView || !ready;
  const coding = view.phase === "coding";

  return {
    sceneRef,
    battery: view.battery,
    phase: view.phase,
    phaseLabel: phaseLabel(view.phase),
    facing: view.facing,
    activity: view.activity,
    frame: view.frame,
    fadeMs: view.fadeMs,
    reacting: view.reacting,
    // Phase 3 runs the bar down, so it is neither charging nor idle.
    charging: !paused && !coding && view.battery < sceneConfig.battery.fullPercent,
    discharging: !paused && coding,
    paused,
    ready,
    reducedMotion,
    speed,
    debug,
    loads,
    missing,
    dialogue,
    think: view.think,
    code: view.code,
    click,
    setBattery,
    setSpeed,
    showFinale,
    jumpTo,
  };
}