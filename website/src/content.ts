// Every piece of copy on the page lives here, so editing text never means touching components.

export const links = {
  repo: "https://github.com/savani-codes/ownerless",
  runIt: "https://github.com/savani-codes/ownerless#run-it",
  switch: "https://switchagents.ai",
  hackathon: "https://www.wemakedevs.org/hackathons/switch",
  jars: "https://github.com/jishanahmed-shaikh",
  sav: "https://github.com/savani-codes",
} as const;

/** Set to the YouTube video id once the demo is published; the Demo section embeds it. */
export const demoVideoId = "";

export const nav = [
  { id: "how", label: "How it works" },
  { id: "switch", label: "Switch" },
  { id: "architecture", label: "Architecture" },
  { id: "run", label: "Run it" },
] as const;

export const hero = {
  eyebrow: "Flip the Switch Hackathon 2026 · Best Business Workflow",
  title: "The incident that finds its own missing owner.",
  lede:
    "A Switch room where two engineers and two Claude Code agents fix a broken data pipeline together. " +
    "The agents find that the table at fault has no owner. A person takes it in the chat, and nothing " +
    "changes without two people agreeing.",
};

export type ThreadMessage = {
  who: string;
  role: string;
  kind: "human" | "investigator" | "operator";
  /** Plain text; words wrapped in @…@ render as mentions, `…` as code, **…** as bold. */
  text: string;
  prompt?: string;
};

export const thread: ThreadMessage[] = [
  { who: "JARS", role: "on call", kind: "human", text: "@@investigator@ daily_revenue didn't refresh, what happened?" },
  {
    who: "investigator",
    role: "agent · read-only",
    kind: "investigator",
    text:
      "`validate_orders` failed: 3 products were deleted upstream, so orders point at nothing. " +
      "**raw.products has no owner in DataHub.** Data Platform owns the other raw tables. " +
      "Plan for @@operator@: a. assign owner, b. restore products, c. rerun.",
  },
  { who: "SAV", role: "Data Platform", kind: "human", text: "Data Platform owns products. I approve a, b and c." },
  {
    who: "operator",
    role: "agent · gated",
    kind: "operator",
    text: "Step a: making Data Platform the owner of raw.products.",
    prompt: "ownerless datahub set-owner",
  },
  {
    who: "operator",
    role: "agent · gated",
    kind: "operator",
    text: "✓ Owner set · products restored · run green. Incident log written.",
  },
];

export const statement = {
  lead: "At 2 AM the revenue pipeline breaks, and the table at fault has no owner.",
  muted: "Normally that's an hour of tabs, a Slack hunt for a name, and a fix nobody wants an AI to make alone.",
  stats: [
    { value: 2, label: "people" },
    { value: 2, label: "messages" },
    { value: 3, label: "clicks to fix" },
    { value: 0, label: "unapproved changes", accent: true },
  ],
};

export const steps = [
  {
    title: "Report",
    text: "The on-call engineer mentions @investigator in the room. That's the whole alert.",
    tag: "JARS · 1 message",
    tone: "blue",
  },
  {
    title: "Investigate",
    text:
      "It reads Airflow, the error log, the warehouse, DataHub and lineage, then posts a report where every " +
      "claim has a link. It spots the table with no owner and asks who should own it.",
    tag: "investigator · read-only",
    tone: "blue",
  },
  {
    title: "Approve",
    text: "The Data Platform lead takes ownership and approves the numbered plan in plain words. An agent's message never counts.",
    tag: "SAV · 1 message",
    tone: "peach",
  },
  {
    title: "Fix and log",
    text:
      "@operator assigns the owner, restores the data and reruns the pipeline. Each step stops at a " +
      "permission prompt. Then it verifies and writes the incident log.",
    tag: "operator · 3 Allow clicks",
    tone: "amber",
  },
] as const;

export const keys = [
  {
    label: "Key one",
    title: "The owner approves",
    text: "A person who owns the dataset approves the numbered steps in the thread. The operator acts on nothing else.",
  },
  {
    label: "Key two",
    title: "A person allows each command",
    text:
      "Writes are never allowlisted, so Claude Code asks, and Switch shows Allow / Decline in the room. " +
      "CI fails if a write ever slips into an allowlist.",
  },
];

export const switchFeatures = [
  { title: "Room template", text: "One form creates both agents, the room, its rules, a group directory and a kickoff." },
  { title: "Two agents, one room", text: "Separate Claude Code sessions, each in its own folder with its own role and permissions." },
  { title: "@mentions and threads", text: "People start agents, agents hand off to each other, and the whole incident lives in one thread." },
  { title: "Permission prompts", text: "Every write waits for Allow or Decline from a person, right in the chat." },
  { title: "Room instructions", text: "The workflow and the two-key rule, read by every agent that joins." },
  { title: "Room documents", text: "A group directory goes in. The incident log comes out." },
];

export const architecture = {
  chat: { title: "Discord", note: "#retail-incidents" },
  switch: "Switch Console",
  agents: [
    { title: "@investigator", note: "read-only" },
    { title: "@operator", note: "writes gated" },
  ],
  cli: "ownerless CLI",
  systems: ["Airflow 3.3", "DataHub", "Postgres", "Cognee"],
};

export const runIt = {
  intro:
    "Windows with Git Bash, macOS or Linux. You need Docker, uv, the DataHub CLI and Switch Console with " +
    "Claude Code. Then create the room from switch/ownerless.template.yaml.",
  blocks: [
    {
      comment: "the stack",
      lines: [
        "git clone --recurse-submodules https://github.com/savani-codes/ownerless.git",
        "cd ownerless",
        "datahub docker quickstart",
        "scripts/setup.sh",
        "scripts/up.sh --seed",
        "scripts/preflight.sh",
      ],
    },
    { comment: "the incident", lines: ["ownerless scenario reset", "ownerless scenario break", "ownerless scenario trigger"] },
    { comment: "then, in the room", lines: ["@investigator daily_revenue didn't refresh, what happened?"] },
  ],
};
