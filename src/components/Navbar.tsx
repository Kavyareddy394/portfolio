"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Navbar.module.scss";
import { navItems, site } from "@/lib/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useScrollSpy } from "@/hooks/useScrollSpy";

export function Navbar() {
  const ids = useMemo(() => navItems.map((item) => item.id), []);
  const activeId = useScrollSpy(ids);
  const progress = useScrollProgress();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.dataset.menuOpen = menuOpen ? "true" : "false";
    return () => {
      document.body.dataset.menuOpen = "false";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled}
      data-open={menuOpen}
    >
      <div className={styles.bar}>
        <a className={styles.brand} href="#home">
          <span className={styles.mark}>{site.initials}</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{site.name}</span>
            <span className={styles.brandRole}>{site.role}</span>
          </span>
        </a>

        <nav className={styles.links} aria-label="Sections">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={styles.link}
              href={`#${item.id}`}
              data-active={activeId === item.id}
              aria-current={activeId === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.toggleBar} data-open={menuOpen} />
            <span className={styles.toggleBar} data-open={menuOpen} />
          </button>
        </div>
      </div>

      <span
        className={styles.progress}
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      <div id="mobile-menu" className={styles.menu} hidden={!menuOpen}>
        <ul className={styles.menuList}>
          {navItems.map((item, index) => (
            <li key={item.id} style={{ transitionDelay: `${index * 40}ms` }}>
              <a
                className={styles.menuLink}
                href={`#${item.id}`}
                data-active={activeId === item.id}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.menuIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}