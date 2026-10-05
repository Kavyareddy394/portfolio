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
  name: "Kavya Ramatatagari",
  initials: "KR",
  role: "Software Developer",
  tagline: "Full-stack apps, microservices and AI/ML.",
  location: "Bangalore, India",
  email: "kavya394113@gmail.com",
  phone: "+91-8985270016",
  socials: [
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/kavyaramatatagari",
    },
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
  heading: "Full-stack, microservices and AI/ML.",
  paragraphs: [
    "I build across the stack. React, Next.js and Node on the front; C# and .NET microservices on Azure and Docker at Schneider Electric; Java when the job is somebody else's backend platform. On the side I build things end to end and actually ship them, which is how SafeReach and HomeTracker exist.",
    "AI/ML is the part I'm genuinely curious about rather than the part I'm quickest at. Cognitive load classification from EEG data, a stretch of work on quantum datasets — both taught me that the hard part is almost never the model, it's what you feed it. I want to keep going down that road.",
  ],
  highlights: [
    { label: "Focus", value: "Full-stack applications & microservices" },
    { label: "Currently", value: "Graduate Engineer Trainee @ Schneider Electric" },
    { label: "Curious about", value: "AI/ML" },
  ],
};

export const education: Education[] = [
  {
    degree: "B.Tech, Computer Science and Engineering",
    school: "VIT AP University",
    period: "Sep 2022 — Present",
    detail:
      "Coursework: OOP, DSA, DBMS, Operating Systems, Computer Networks, DAA.",
    highlights: ["CGPA 9.47 / 10"],
  },
  {
    degree: "Intermediate",
    school: "Narayana Junior College",
    period: "Jul 2020 — Jul 2022",
    highlights: ["95.3%"],
  },
];

export const experience: Experience[] = [
  {
    role: "Graduate Engineer Trainee",
    company: "Schneider Electric",
    period: "Jan 2026 — Present",
    highlights: [
      "Developed backend services and microservices using C# and .NET, leveraging Azure cloud technologies and Docker, following Agile practices focused on scalability, reliability and seamless system integration.",
      "Customised the Windchill backend platform with Java and developed the accompanying test cases.",
      "Write and maintain unit, service-level and domain-level test cases to ensure code quality, stability and seamless integration.",
    ],
    stack: ["C#", ".NET", "Java", "Windchill", "Azure", "Docker"],
  },
  {
    role: "Dataset Team Lead",
    company: "Anantwave",
    period: "Feb 2025 — Dec 2025",
    highlights: [
      "Led the design and development of diverse quantum datasets for quantum machine learning, quantum algorithms and image processing tasks.",
    ],
    stack: ["Quantum computing", "Machine learning", "Deep learning"],
  },
];

export const projects: Project[] = [
  {
    title: "SafeReach",
    summary:
      "An emergency SOS escalation system with real-time alerts, live location sharing and emergency contact notifications. Delayed escalation workflows notify authorities if the user stays unresponsive within a defined safety window.",
    tags: ["Node.js", "Next.js", "TypeScript", "MySQL", "Firebase"],
    year: "2025",
    featured: true,
  },
  {
    title: "HomeTracker",
    summary:
      "A full-stack web app for monitoring construction activity: worker data, material usage and cost tracking in one place.",
    tags: ["HTML", "CSS", "JavaScript", "Node.js", "MySQL"],
    year: "2025",
    featured: true,
  },
  {
    title: "CogniClassify",
    summary:
      "A cognitive load classification system built on pre-recorded EEG data, using FFDNN models combining machine learning and deep learning for real-time detection.",
    tags: ["Python", "Deep learning", "EEG"],
    year: "2025",
    featured: true,
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    skills: [
      { name: "Java", level: 88 },
      { name: "C# / .NET", level: 85 },
      { name: "Python", level: 80 },
      { name: "JavaScript", level: 85 },
      { name: "HTML / CSS", level: 90 },
      { name: "SQL", level: 85 },
    ],
  },
  {
    label: "Frameworks & Cloud",
    skills: [
      { name: "ASP.NET", level: 84 },
      { name: "React / Next.js", level: 82 },
      { name: "Node.js", level: 80 },
      { name: "Azure", level: 78 },
      { name: "AWS", level: 74 },
      { name: "MySQL / MongoDB", level: 82 },
    ],
  },
  {
    label: "Tools",
    skills: [
      { name: "Docker", level: 78 },
      { name: "Git / GitHub", level: 88 },
      { name: "Windchill (PLM)", level: 76 },
      { name: "Visual Studio", level: 86 },
      { name: "PowerShell", level: 74 },
    ],
  },
];

export const certificates: string[] = [
  "AWS Certified Cloud Practitioner",
  "MongoDB Associate Database Admin",
  "Build Your Own Dynamic Web Application",
];