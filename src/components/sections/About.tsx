import styles from "./About.module.scss";
import { SectionHeading } from "@/components/SectionHeading";
import { about } from "@/lib/content";

export function About() {
  return (
    <section id="about" className={`section ${styles.about}`}>
      <div className="container">
        <SectionHeading
          id="about"
          eyebrow="About"
          title={about.heading}
        />

        <div className={styles.grid}>
          <div className={styles.copy}>
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <dl className={styles.facts}>
            {about.highlights.map((item) => (
              <div key={item.label} className={styles.fact}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}