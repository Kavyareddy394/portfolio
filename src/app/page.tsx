import { Hero } from "@/components/Hero/Hero";
import { About } from "@/components/sections/About";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";

/**
 * One page, in reading order.
 *
 * Every section here carries the id the navbar links to, and .section sets
 * scroll-margin-top: var(--nav-height) in globals.scss, so a link jump lands the
 * heading clear of the fixed bar instead of underneath it.
 *
 * The copy behind all of it is in lib/content.ts.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <About />
      <Education />
      <Experience />
      <Projects />
      <Skills />
      <Contact />
    </>
  );
}