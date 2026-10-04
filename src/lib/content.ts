export type NavItem = { id: string; label: string };

export type Education = {
  degree: string;
  school: string;
  period: string;
  location?: string;
  detail?: string;
  highlights?: string[];
};

export type Experience = {
  role: string;
  company: string;
  period: string;
  location?: string;
  detail?: string;
  highlights?: string[];
  stack?: string[];
};

export type Project = {
  title: string;
  summary: string;
  tags: string[];
  href?: string;
  repo?: string;
  year?: string;
  featured?: boolean;
};

export type SkillGroup = {
  label: string;
  skills: { name: string; level: number }[];
};

export const site = {
  name: "Your Name",
  initials: "YN",
  role: "Creative Developer",
  tagline: "I design and build digital experiences that feel alive.",
  location: "Bengaluru, India",
  email: "hello@example.com",
  socials: [
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "X", href: "https://x.com" },
  ],
};

export const navItems: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export const about = {
  heading: "Craft at the meeting point of design and engineering.",
  paragraphs: [
    "Placeholder copy — swap this for two or three sentences about who you are, what you specialise in, and the kind of work you want to be known for. Keep it concrete: the problems you like solving and the tools you reach for.",
    "A second paragraph works well here for context: what you are currently learning, what you are looking for next, or a philosophy you build with. Two paragraphs is the sweet spot for this section.",
  ],
  highlights: [
    { label: "Focus", value: "Interactive front-ends & motion" },
    { label: "Currently", value: "Building design systems" },
    { label: "Open to", value: "Freelance & full-time roles" },
  ],
};

export const education: Education[] = [
  {
    degree: "B.Tech, Computer Science",
    school: "University Name",
    period: "2021 — 2025",
    location: "City, Country",
    detail: "Graduated with distinction. Coursework in data structures, computer graphics and human–computer interaction.",
    highlights: ["CGPA 8.9 / 10", "Dean's List", "Club lead, year two"],
  },
  {
    degree: "Senior Secondary, Science",
    school: "School Name",
    period: "2019 — 2021",
    location: "City, Country",
    highlights: ["94%", "Mathematics & Physics"],
  },
];

export const experience: Experience[] = [
  {
    role: "Frontend Engineer",
    company: "Company Name",
    period: "2025 — Present",
    location: "Remote",
    detail:
      "One-line summary of your scope and impact. Lead with the outcome, then the how.",
    highlights: [
      "Rebuilt the marketing site in Next.js, lifting Lighthouse performance from 54 to 98.",
      "Introduced a token-based design system adopted by four product teams.",
      "Mentored two junior engineers through their first production releases.",
    ],
    stack: ["Next.js", "TypeScript", "SCSS", "Framer Motion"],
  },
  {
    role: "Design Engineer Intern",
    company: "Studio Name",
    period: "Summer 2024",
    location: "City, Country",
    highlights: [
      "Built 30+ reusable React components and the documentation site around them.",
      "Prototyped motion studies for a client pitch that won the account.",
    ],
    stack: ["React", "GSAP", "Figma"],
  },
];

export const projects: Project[] = [
  {
    title: "Project One",
    summary:
      "A short, confident description of the problem and what you built. Two sentences maximum — link out for the rest.",
    tags: ["Next.js", "Postgres"],
    year: "2025",
    featured: true,
    href: "#",
    repo: "#",
  },
  {
    title: "Project Two",
    summary:
      "What makes this project interesting? Lead with the interesting constraint, the technique, or the result you are proud of.",
    tags: ["TypeScript", "WebGL"],
    year: "2025",
    href: "#",
    repo: "#",
  },
  {
    title: "Project Three",
    summary:
      "Keep the pattern consistent so the grid reads as one system. Cards should feel related at a glance.",
    tags: ["Python", "FastAPI"],
    year: "2024",
    href: "#",
  },
  {
    title: "Project Four",
    summary:
      "Four cards is a comfortable desktop row count. Add or remove freely — the grid adapts.",
    tags: ["React", "Tailwind"],
    year: "2024",
    href: "#",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    skills: [
      { name: "TypeScript", level: 92 },
      { name: "JavaScript", level: 95 },
      { name: "Python", level: 78 },
      { name: "HTML / CSS", level: 96 },
    ],
  },
  {
    label: "Frameworks",
    skills: [
      { name: "React / Next.js", level: 90 },
      { name: "Three.js", level: 70 },
      { name: "Node.js", level: 75 },
      { name: "Blender", level: 62 },
    ],
  },
  {
    label: "Craft",
    skills: [
      { name: "Motion design", level: 82 },
      { name: "Design systems", level: 86 },
      { name: "Figma", level: 80 },
      { name: "Technical writing", level: 74 },
    ],
  },
];