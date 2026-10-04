import styles from "./Skills.module.scss";
import { SectionHeading } from "@/components/SectionHeading";
import { skillGroups } from "@/lib/content";

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
      </div>
    </section>
  );
}