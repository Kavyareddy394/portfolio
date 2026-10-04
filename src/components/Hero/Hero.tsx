"use client";

import styles from "./Hero.module.scss";
import { Scene } from "@/components/Scene/Scene";
import { Battery } from "@/components/Battery/Battery";
import { TerminalPlaceholder } from "@/components/TerminalPlaceholder/TerminalPlaceholder";
import { DebugOverlay } from "@/components/DebugOverlay";
import { useSceneController } from "@/hooks/useSceneController";

export function Hero() {
  const scene = useSceneController();

  return (
    <section id="home" className={styles.hero}>
      {/*
        The scene paints first as a full-bleed background layer. Everything
        else is stacked above it, so the artwork is the page rather than a box
        sitting in it.
      */}
      <Scene
        sceneRef={scene.sceneRef}
        frame={scene.frame}
        fadeMs={scene.fadeMs}
        facing={scene.facing}
        activity={scene.activity}
        ready={scene.ready}
        reducedMotion={scene.reducedMotion}
        debug={scene.debug}
        loads={scene.loads}
        dialogue={scene.dialogue}
        onActivate={() => scene.click()}
      />

      <div className={`container ${styles.shell}`}>
        <div className={styles.content}>
          <TerminalPlaceholder
            phaseLabel={scene.phaseLabel}
            battery={scene.battery}
            charging={scene.charging}
            discharging={scene.discharging}
            paused={scene.paused}
          />

          <Battery
            percent={scene.battery}
            phaseLabel={scene.phaseLabel}
            charging={scene.charging}
            discharging={scene.discharging}
            paused={scene.paused}
          />
        </div>
      </div>

      {scene.debug ? (
        <DebugOverlay
          battery={scene.battery}
          phase={scene.phaseLabel}
          activity={scene.activity}
          reacting={scene.reacting}
          facing={scene.facing}
          frame={scene.frame}
          think={scene.think}
          code={scene.code}
          ready={scene.ready}
          paused={scene.paused}
          speed={scene.speed}
          missing={scene.missing}
          onSetBattery={scene.setBattery}
          onClick={() => scene.click(true)}
          onShowFinale={scene.showFinale}
          onJumpTo={scene.jumpTo}
          onSetSpeed={scene.setSpeed}
        />
      ) : null}
    </section>
  );
}