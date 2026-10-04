import styles from "./Contact.module.scss";
import { ArrowUpRight, Mail } from "@/components/Icons";
import { site } from "@/lib/content";

export function Contact() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          <p className="eyebrow">Contact</p>

          <h2 className={styles.heading}>
            Let&rsquo;s build something{" "}
            <span className="gradient-text">worth remembering.</span>
          </h2>

          <p className={styles.blurb}>
            Open to freelance projects, contract work and full-time roles.
            The fastest way to reach me is email.
          </p>

          <div className={styles.actions}>
            <a className="btn btn--primary" href={`mailto:${site.email}`}>
              <Mail />
              {site.email}
            </a>
            <a className="btn btn--ghost" href="#projects">
              Browse projects
            </a>
          </div>

          <ul className={styles.socials}>
            {site.socials.map((social) => (
              <li key={social.label}>
                <a className={styles.social} href={social.href}>
                  {social.label}
                  <ArrowUpRight size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.bottom}>
          <p>
            &copy; {new Date().getFullYear()} {site.name}
          </p>
          <p>Built with Next.js, TypeScript and SCSS.</p>
        </div>
      </div>
    </footer>
  );
}