import styles from "./Projects.module.scss";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowUpRight } from "@/components/Icons";
import { projects } from "@/lib/content";

export function Projects() {
  return (
    <section id="projects" className="section section--alt">
      <div className="container">
        <SectionHeading
          id="projects"
          eyebrow="Projects"
          title="Selected work."
          subtitle="A few things worth talking about. Add, remove or reorder entries in lib/content.ts."
        />

        <ul className={styles.grid}>
          {projects.map((project) => (
            <li key={project.title} className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.title}>{project.title}</h3>
                {project.year ? (
                  <span className={styles.year}>{project.year}</span>
                ) : null}
              </div>

              <p className={styles.summary}>{project.summary}</p>

              <ul className={styles.tags}>
                {project.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>

              <div className={styles.links}>
                {project.href ? (
                  <a
                    className={styles.link}
                    href={project.href}
                    aria-label={`Open ${project.title}`}
                  >
                    Live
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
                {project.repo ? (
                  <a
                    className={styles.link}
                    href={project.repo}
                    aria-label={`View ${project.title} source`}
                  >
                    Source
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
              </div>

              <span className={styles.glow} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}