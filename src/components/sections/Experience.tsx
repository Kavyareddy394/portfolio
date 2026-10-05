import { SectionHeading } from "@/components/SectionHeading";
import { experience } from "@/lib/content";
import styles from "./Timeline.module.scss";

export function Experience() {
  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHeading
          id="experience"
          eyebrow="Experience"
          title="Roles, teams and things shipped."
          subtitle="Outcomes first — the mechanism is the footnote."
        />

        {/* Split rather than stacked: the two roles are read side by side, and the wider
            column is sized to the one with more to say. Education keeps the plain
            vertical list. */}
        <ol className={`${styles.list} ${styles.split}`}>
          {experience.map((item) => (
            <li key={item.role} className={styles.item}>
              <div className={styles.top}>
                <h3 className={styles.role}>{item.role}</h3>
                <p className={styles.period}>{item.period}</p>
              </div>

              <p className={styles.org}>
                {item.company}
                {item.location ? ` · ${item.location}` : ""}
              </p>

              {item.highlights?.length ? (
                <ul className={styles.points}>
                  {item.highlights.map((point) => (
                    <li key={point} className={styles.point}>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.stack?.length ? (
                <ul className={styles.stack}>
                  {item.stack.map((tool) => (
                    <li key={tool} className={styles.tag}>
                      {tool}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}