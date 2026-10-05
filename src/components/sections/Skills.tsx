import styles from "./Skills.module.scss";
import { SectionHeading } from "@/components/SectionHeading";
import { certificates, skillGroups } from "@/lib/content";

export function Skills() {
  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHeading
          id="skills"
          eyebrow="Skills"
          title="Tools of the trade."
          subtitle="Levels are honest self-assessments, not a ranking."
        />

        <div className={styles.grid}>
          {skillGroups.map((group) => (
            <div key={group.label} className={styles.group}>
              <h3 className={styles.groupLabel}>{group.label}</h3>

              <ul className={styles.list}>
                {group.skills.map((skill) => (
                  <li key={skill.name} className={styles.skill}>
                    <div className={styles.row}>
                      <span className={styles.name}>{skill.name}</span>
                      <span className={styles.level}>{skill.level}</span>
                    </div>

                    <span
                      className={styles.track}
                      style={
                        {
                          "--level": `${skill.level}%`,
                          "--delay": `${skillGroups
                            .indexOf(group) * 90}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.fill} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/*
          Certifications sit inside Skills rather than in a section of their own:
          they are three lines, and a whole nav entry for them would be more
          navigation than content. Rendered as a flat list rather than bars, because
          these are pass/fail, not a self-assessed level.
        */}
        {certificates.length > 0 ? (
          <div className={styles.certs}>
            <h3 className={styles.certsLabel}>Certifications</h3>
            <ul className={styles.certsList}>
              {certificates.map((certificate) => (
                <li key={certificate} className={styles.cert}>
                  {certificate}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}