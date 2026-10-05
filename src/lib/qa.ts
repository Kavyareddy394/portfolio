/**
 * Answers questions about the resume, with no model involved.
 *
 * The whole thing is a scoring pass: the query is stemmed, filler words are
 * dropped, and every intent gets a list of trigger words and phrases. Whichever
 * intent collects the most points answers.
 *
 * That is enough for the queries a visitor actually types to a portfolio ("what
 * have you built", "do you know react", "are you free"), because none of them need
 * understanding, they need a synonym list. It is not enough for anything with
 * intent behind it ("what is your greatest weakness"), and it deliberately does not
 * pretend otherwise: anything below the score floor is reported as unknown instead
 * of being answered with the nearest thing it found.
 *
 * The data lives in data/resume.json. Editing that file is the only step needed to
 * change what the terminal knows.
 */

import resumeData from "@/data/resume.json";

export const resume = resumeData;

/* Text matching ----------------------------------------------------------- */

/**
 * Words that carry no intent. Dropped before scoring so that "can you tell me about
 * your projects" is scored on the same two words as "projects".
 */
const STOP_WORDS = new Set([
  "a", "about", "an", "and", "any", "are", "as", "at", "be", "been", "but", "by",
  "can", "could", "did", "do", "does", "for", "from", "get", "give", "had", "has",
  "have", "he", "her", "him", "his", "how", "i", "if", "in", "is", "it", "its",
  "just", "me", "more", "my", "no", "not", "of", "on", "or", "our", "please",
  "she", "should", "so", "some", "than", "that", "the", "their", "them", "then",
  "there", "they", "this", "to", "too", "up", "us", "was", "we", "were", "what",
  "when", "where", "which", "who", "why", "will", "with", "would", "you", "your",
]);

/**
 * Crude suffix stripping, enough to make "projects" and "project" the same token
 * and "worked" and "work" the same token.
 *
 * A real stemmer would do better, but the alternative is a dependency for a job
 * this small: the trigger lists are written by hand anyway, so the only question
 * is whether they contain the forms visitors type, and they do.
 */
function stem(word: string): string {
  let out = word;

  if (out.length > 4 && out.endsWith("ies")) return `${out.slice(0, -3)}y`;
  if (out.length > 4 && out.endsWith("sses")) return out.slice(0, -2);
  if (out.length > 4 && out.endsWith("ing")) return out.slice(0, -3);
  if (out.length > 4 && out.endsWith("ed")) return out.slice(0, -2);
  if (out.length > 4 && out.endsWith("ly")) return out.slice(0, -2);

  /* Order matters: "ss" and "us" are kept so "class" and "bonus" survive. */
  if (out.length > 3 && out.endsWith("s") && !/(ss|us|is)$/.test(out)) {
    out = out.slice(0, -1);
  }

  return out;
}

/**
 * Splits a query into stemmed content words.
 *
 * C, C++, C# are kept as-is because they are the tokens people type when asking
 * about languages, and "+" is what makes c++ survive. Everything else is reduced
 * to a-z0-9 so punctuation and stray symbols cannot produce phantom tokens.
 */
function contentTokens(text: string): string[] {
  return rawTokens(text).map(stem).filter((token) => !STOP_WORDS.has(token));
}

/**
 * The same split without stemming, and without the stop word filter.
 *
 * Both exist because the stemmer cannot be trusted on product names. It turns
 * "nextjs" into "nextj", which then fails to match anything in resume.json, so the
 * unstemmed tokens are searched alongside the stemmed ones and whichever set hits
 * wins.
 */
function rawTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/c\+\+|c#/g, " c ")
    .replace(/[^a-z0-9+]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 1);
}

/* Intents ---------------------------------------------------------------- */

export type Intent =
  | "identity"
  | "role"
  | "summary"
  | "location"
  | "contact"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certificates"
  | "socials"
  | "unknown";

type Rule = {
  intent: Exclude<Intent, "unknown">;
  /** Multi-word triggers, matched against the raw query. Worth more than a word. */
  phrases?: readonly string[];
  /** Single word triggers, matched against the stemmed query. */
  words?: readonly string[];
  /**
   * Guard: the intent only scores if this is in the query too. Used where a word
   * is ambiguous, so "live" needs "where" nearby to mean location.
   */
  requires?: readonly string[];
};

const RULES: readonly Rule[] = [
  {
    intent: "identity",
    phrases: [
      "who are you", "who is this", "introduce yourself", "tell me about yourself",
      "your name", "whats your name", "what is your name",
    ],
    words: ["name", "introduce", "yourself"],
  },
  {
    intent: "role",
    phrases: ["what do you do", "what kind of work", "what do you make", "your job"],
    words: ["role", "title", "job", "profession", "specialise", "specialize", "discipline"],
  },
  {
    intent: "summary",
    phrases: ["tell me about you", "describe yourself", "who is the developer"],
    words: ["about", "describe", "summary", "bio", "explain"],
  },
  {
    intent: "location",
    phrases: ["where are you based", "where do you live", "where are you from", "what city"],
    words: ["location", "city", "country", "based", "live", "living"],
    requires: ["where", "live", "based", "from", "location", "city"],
  },
{
    intent: "contact",
    phrases: [
      "how do i contact you", "get in touch", "reach you", "email you",
      "contact details", "contact info", "phone number",
    ],
    words: ["contact", "email", "mail", "phone", "touch", "message"],
  },
  {
    intent: "skills",
    phrases: [
      "what is your stack", "what tech do you use", "what are you good at",
      "which languages", "what languages", "tech stack", "what tools",
      "what do you know", "do you know", "do you use", "have you used", "how are you at",
    ],
    words: [
      "skill", "stack", "tech", "technology", "tool", "framework", "language",
      "programming", "software", "library", "expert", "proficient", "good", "know", "use", "used",
    ],
  },
  {
    intent: "experience",
    phrases: [
      "work history", "tell me about your experience", "where have you worked",
      "how long have you been", "what companies", "professional background",
    ],
    words: ["experience", "worked", "work", "job", "career", "company", "employer", "history", "previous"],
  },
  {
    intent: "projects",
    phrases: [
      "what have you built", "show me your work", "what have you made",
      "tell me about your projects", "anything i can see", "case study",
    ],
    words: ["project", "build", "built", "make", "made", "create", "created", "portfolio", "app", "demo"],
  },
  {
    intent: "education",
    phrases: ["where did you study", "what did you study", "academic background"],
words: ["education", "study", "studied", "school", "college", "university", "degree", "course", "learn", "graduated", "btech", "mtech", "phd", "masters", "bachelor", "cgpa", "intermediate"],
  },
  {
    intent: "certificates",
    phrases: [
      "what certificates do you have", "do you have any certifications",
      "any certifications", "which certifications",
    ],
    /*
      Deliberately no technology names here. "mongodb" is a certificate, but it is
      also a skill, and a word trigger here would claim it before the skill lookup
      ever got a chance. The certificate titles themselves are matched instead, by
      the same fallback that recognises skill names.
    */
    words: ["certificate", "certification", "certifications", "certified", "cert"],
  },
  {
    intent: "socials",
    phrases: ["where can i find you", "social links", "social media", "find you online"],
    words: ["github", "linkedin", "twitter", "social", "profile", "handle", "follow", "repo", "repository"],
  },
];

/* Answers ---------------------------------------------------------------- */

const { basics, skills, experience, projects, education, certificates, socials } = resume;

function answerIdentity(): string {
  return `${basics.name}
${basics.role} in ${basics.location}.
${basics.tagline}`;
}

function answerRole(): string {
  return `${basics.role}.
${basics.tagline}

Ask for 'about' if you want the longer version.`;
}

function answerSummary(): string {
  return `${basics.name} - ${basics.role}
${basics.summary}`;
}

function answerLocation(): string {
  return `Based in ${basics.location}.`;
}

function answerContact(): string {
  const lines = [`Email: ${basics.email}`];
  if (basics.phone) lines.push(`Phone: ${basics.phone}`);
  lines.push(`Based in ${basics.location}`);
  return lines.join("\n");
}

function answerSkills(): string {
  return skills
    .map((group) => `${group.group}: ${group.items.join(", ")}`)
    .join("\n");
}

/*
  "do you know react" wants a different shape of answer from "what's your stack":
  one yes, then the rest of the list for context. Split out so the matcher can lead
  with the thing that was actually asked about.
*/
function answerSkillsAbout(matched: string[]): string {
  const confirmed = matched.map((name) => {
    const group = skills.find((entry) =>
      entry.items.some((item) => item.toLowerCase() === name.toLowerCase()),
    );
    return group ? `${name} (${group.group.toLowerCase()})` : name;
  });

  return [`Yes: ${confirmed.join(", ")}.`, "", answerSkills()].join("\n");
}

function answerExperience(): string {
  return experience
    .map((role) => {
      const period = `${role.start} - ${role.end}`;
      const highlights = role.highlights.map((line) => `  - ${line}`).join("\n");
      return `${role.role} @ ${role.company} (${period})
${role.summary}${highlights ? `\n${highlights}` : ""}`;
    })
    .join("\n\n");
}

function answerProjects(): string {
  return projects
    .map((project) => {
      const stack = project.stack.length ? ` [${project.stack.join(", ")}]` : "";
      const link = project.repo || project.url;
      return `${project.name}${stack}
${project.description}${link ? `\n${link}` : ""}`;
    })
    .join("\n\n");
}

function answerEducation(): string {
  return education
    .map((entry) => {
      const period = `${entry.start} - ${entry.end}`;
      const field = entry.field ? `, ${entry.field}` : "";
      const notes = entry.notes ? `\n${entry.notes}` : "";
      return `${entry.degree}${field} - ${entry.school} (${period})${notes}`;
    })
    .join("\n\n");
}

function answerCertificates(): string {
  return certificates.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

function answerSocials(): string {
  return socials.map((account) => `${account.label}: ${account.url}`).join("\n");
}

const ANSWERS: Record<Exclude<Intent, "unknown">, () => string> = {
  identity: answerIdentity,
  role: answerRole,
  summary: answerSummary,
  location: answerLocation,
  contact: answerContact,
  skills: answerSkills,
  experience: answerExperience,
  projects: answerProjects,
  education: answerEducation,
  certificates: answerCertificates,
  socials: answerSocials,
};

/**
 * Every skill name in the file, split into the words it is made of.
 *
 * This is the fallback that answers "do you know react" without "react" ever being
 * written into a trigger list. It reads resume.json, so adding a language to the
 * JSON makes the terminal recognise it too, with no second edit anywhere else.
 */
const skillTerms = new Map<string, string>();

function indexTerm(map: Map<string, string>, value: string) {
  for (const term of value.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean)) {
    map.set(term, value);
    /* "next.js" also has to answer to "next". */
    const head = term.split(/[.#]/)[0];
    if (head !== term) map.set(head, value);
    /*
      And to "nextjs", which is how people type it when they are in a hurry. Only
      recorded when it differs, so the map is not padded with aliases equal to the
      term itself.
    */
    const compact = term.replace(/[^a-z0-9+]/g, "");
    if (compact !== term) map.set(compact, value);
  }
}

for (const group of skills) {
  for (const item of group.items) indexTerm(skillTerms, item);
}

/**
 * Project names are indexed the same way, so typing one on its own gets an answer
 * about that project rather than the whole list.
 */
const projectTerms = new Map<string, string>();
for (const project of projects) indexTerm(projectTerms, project.name);

function matchedSkills(query: string, tokens: string[]): string[] {
  const found = new Set<string>();
  for (const token of [...rawTokens(query), ...tokens]) {
    const name = skillTerms.get(token);
    if (name) found.add(name);
  }
  return [...found];
}

function matchedProjects(query: string, tokens: string[]): string[] {
  const found = new Set<string>();
  for (const token of [...rawTokens(query), ...tokens]) {
    const name = projectTerms.get(token);
    if (name) found.add(name);
  }
  return [...found];
}

function answerProjectsAbout(names: string[]): string {
  const chosen = projects.filter((project) => names.includes(project.name));
  return chosen
    .map((project) => {
      const stack = project.stack.length ? ` [${project.stack.join(", ")}]` : "";
      return `${project.name}${stack}\n${project.description}`;
    })
    .join("\n\n");
}

/* Public ----------------------------------------------------------------- */

export type Reply = {
  intent: Intent;
  text: string;
};

/** Below this, nothing is said about which rule matched. It was noise. */
const SCORE_FLOOR = 1;

/** Words typed often enough that they are worth offering as one-tap questions. */
export const suggestions = [
  "who are you",
  "what's your stack",
  "what have you built",
  "work history",
  "where did you study",
  "any certifications",
] as const;

export function ask(query: string): Reply {
  const raw = query.toLowerCase().replace(/\s+/g, " ").trim();
  const tokens = contentTokens(query);
  const tokenSet = new Set(tokens);

  let best: Exclude<Intent, "unknown"> | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;

    for (const phrase of rule.phrases ?? []) {
      if (raw.includes(phrase)) score += 4;
    }

    for (const word of rule.words ?? []) {
      if (tokenSet.has(stem(word))) score += 1;
    }

    /*
      Guard words score nothing on their own. "live" should read as location only
      when the question is about where somebody is, not in "what do you live for".
    */
    if (rule.requires && !rule.requires.some((word) => raw.includes(word))) {
      score = 0;
    }

    if (score > bestScore) {
      bestScore = score;
      best = rule.intent;
    }
  }

  if (best === null || bestScore < SCORE_FLOOR) {
    /*
      No rule fired, but the query may still be about something in the file. A bare
      technology name scores nothing against the rules because "react" is not a
      trigger word, so it is checked against the skills themselves before giving up.
    */
const found = matchedSkills(query, tokens);
    if (found.length > 0) {
      return { intent: "skills", text: answerSkillsAbout(found) };
    }

    /* Same idea for a project typed by name. */
    const named = matchedProjects(query, tokens);
    if (named.length > 0) {
      return { intent: "projects", text: answerProjectsAbout(named) };
    }

    return {
      intent: "unknown",
      text:
        "Nothing in my resume matches that.\n" +
        `Try one of: ${suggestions.join(", ")}.`,
    };
  }

  /*
    A skills question that names the technology gets the "yes, that one" answer
    rather than the whole list. "do you use sass" asks about sass, and opening with
    three lines of unrelated languages makes it look like sass was missed.
  */
  if (best === "skills") {
    const found = matchedSkills(query, tokens);
    if (found.length > 0) return { intent: best, text: answerSkillsAbout(found) };
  }

  /* "tell me about SafeReach" should be about SafeReach, not about all three. */
  if (best === "projects") {
    const named = matchedProjects(query, tokens);
    if (named.length > 0) return { intent: best, text: answerProjectsAbout(named) };
  }

  return { intent: best, text: ANSWERS[best]() };
}
