"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./TerminalPlaceholder.module.scss";
import { ask, resume, suggestions } from "@/lib/qa";

type TerminalProps = {
  phaseLabel: string;
  battery: number;
  charging: boolean;
  /** Phase 3: the bar is falling rather than charging. */
  discharging: boolean;
  paused: boolean;
};

type Entry = {
  id: number;
  /** A question is echoed back with the prompt; an answer comes from the matcher. */
  kind: "echo" | "reply" | "system";
  text: string;
};

/**
 * The hero's terminal, answering from data/resume.json.
 *
 * Every question is resolved locally by lib/qa.ts and rendered as a pre-wrapped
 * block, so there is no model, no key and nothing to wait for. The cost is that it
 * only knows what that file knows: it matches intent against trigger words, so
 * "what have you built" resolves, and "what is your greatest weakness" is reported
 * as unknown rather than answered with something adjacent.
 */
export function Terminal({
  phaseLabel,
  battery,
  charging,
  discharging,
  paused,
}: TerminalProps) {
  const mode = phaseLabel.toLowerCase();

  const [entries, setEntries] = useState<Entry[]>([
    {
      id: 0,
      kind: "system",
      text:
        `${resume.basics.name}, ${resume.basics.role}.\n` +
        "Ask about skills, projects, experience, education or contact.",
    },
  ]);
  const [value, setValue] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  /*
    The log is a fixed height box that scrolls, so it never grows the panel. The
    panel's height is load bearing: the hero grid gives the terminal row whatever
    is left over the artwork, so a panel that grew with every answer would push the
    scene around.
  */
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries]);

  function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    const reply = ask(trimmed);
    setEntries((current) => [
      ...current,
      { id: current.length, kind: "echo", text: trimmed },
      { id: current.length + 1, kind: "reply", text: reply.text },
    ]);
    setValue("");
  }

  return (
    <div className={styles.window}>
      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <i data-hue="red" />
          <i data-hue="amber" />
          <i data-hue="green" />
        </span>
        <span className={styles.title}>Disturb her at your own risk</span>
        <span className={styles.pointer} aria-hidden="true">
          →
        </span>
      </div>

      <div className={styles.body}>
        {/*
          status stays visible above the log rather than scrolling away: it is the
          one line that is true about the scene instead of the resume.
        */}
        <p className={styles.line}>
          <span className={styles.prompt}>guest</span>
          <span className={styles.path}>:~$</span> status
        </p>
        <p className={styles.line}>
          <span className={styles.muted}>
            mode: {mode} | battery: {Math.round(battery)}% |{" "}
            {paused ? "paused" : discharging ? "draining" : charging ? "charging" : "idle"}
          </span>
        </p>

        {/*
          role="log" with aria-live="polite" so each new answer is announced once,
          without the visitor's own typing being read back at them.
        */}
        <div className={styles.log} ref={logRef} role="log" aria-live="polite">
          {entries.map((entry) => (
            <div key={entry.id} className={styles.entry} data-kind={entry.kind}>
              {entry.kind === "echo" ? (
                <>
                  <span className={styles.prompt}>guest</span>
                  <span className={styles.path}>:~$</span> {entry.text}
                </>
              ) : (
                <span className={styles.output}>{entry.text}</span>
              )}
            </div>
          ))}
        </div>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submit(value);
          }}
        >
          <label className={styles.srOnly} htmlFor="terminal-question">
            Ask about this site&apos;s resume
          </label>
          <span className={styles.prompt} aria-hidden="true">
            guest
          </span>
          <span className={styles.path} aria-hidden="true">
            :~$
          </span>
          <input
            id="terminal-question"
            className={styles.input}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ask me something"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </form>

        {/*
          The suggestions are the whole feature list on one row, and they double as
          the demonstration of what the matcher understands: each is a phrasing a
          visitor would plausibly type, not a menu of field names.
        */}
        <div className={styles.chips}>
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              className={styles.chip}
              onClick={() => submit(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}