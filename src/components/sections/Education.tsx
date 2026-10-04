import { SectionHeading } from "@/components/SectionHeading";
import { education } from "@/lib/content";
import styles from "./Timeline.module.scss";

export function Education() {
  return (
    <section id="education" className="section section--alt">
      <div className="container">
        <SectionHeading
          id="education"
          eyebrow="Education"
          title="Where the fundamentals came from."
          subtitle="Degrees, coursework and the habits they built."
        />

        <ol className={styles.list}>
          {education.map((item) => (
            <li key={item.degree} className={styles.item}>
              <div className={styles.top}>
                <h3 className={styles.role}>{item.degree}</h3>
                <p className={styles.period}>{item.period}</p>
              </div>

              <p className={styles.org}>
                {item.school}
                {item.location ? ` · ${item.location}` : ""}
              </p>

              {item.detail ? <p className={styles.detail}>{item.detail}</p> : null}

              {item.highlights?.length ? (
                <ul className={styles.points}>
                  {item.highlights.map((point) => (
                    <li key={point} className={styles.point}>
                      {point}
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