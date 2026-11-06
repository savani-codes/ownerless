// What the Companion knows. Each entry answers one question; `keywords` are the words people use
// when they ask it. Keep answers short and true to the README; link out for the details.

export type Entry = {
  id: string;
  question: string;
  keywords: string[];
  answer: string[];
  link?: { label: string; href: string };
  /** Ids of entries to suggest next. */
  next?: string[];
};

const REPO = "https://github.com/savani-codes/ownerless";

export const knowledge: Entry[] = [
  {
    id: "what",
    question: "What is Ownerless?",
    keywords: ["ownerless", "what", "about", "product", "idea", "explain", "overview", "pitch", "summary", "this"],
    answer: [
      "Ownerless is a Switch room where two engineers and two Claude Code agents fix a broken data pipeline together.",
      "The agents investigate across Airflow, DataHub, Postgres and Cognee, and discover that the table that broke the pipeline has no owner. A person claims it in the chat, and every fix needs two people to agree.",
    ],
    next: ["how", "switch", "keys"],
  },
  {
    id: "how",
    question: "How does an incident play out?",
    keywords: ["how", "work", "works", "flow", "steps", "process", "incident", "walkthrough", "happen", "workflow"],
    answer: [
      "1. JARS (on call) mentions @investigator: \"daily_revenue didn't refresh, what happened?\"",
      "2. @investigator reads the failed run, logs, warehouse, DataHub and lineage, and posts a linked report. It finds raw.products has no owner and suggests Data Platform.",
      "3. SAV (Data Platform lead) approves the numbered plan in the thread.",
      "4. @operator assigns the owner, restores the products and reruns the pipeline. Each step stops at a Switch permission prompt. Then it writes the incident log.",
    ],
    next: ["keys", "agents", "scenario"],
  },
  {
    id: "switch",
    question: "What is Switch, and how do you use it?",
    keywords: ["switch", "switchagents", "room", "rooms", "platform", "console", "template", "use", "used", "feature", "features"],
    answer: [
      "Switch brings AI agents into the chat where a team already works. In Ownerless it is the whole interface: there is no web app.",
      "We use a room template (agents, room, rules, group directory and kickoff in one form), two agents in one room, @mentions and threads, permission prompts for every write, room instructions, and room documents for the group directory and the incident log.",
    ],
    link: { label: "switchagents.ai", href: "https://switchagents.ai" },
    next: ["template", "keys", "discord"],
  },
  {
    id: "agents",
    question: "What do the two agents do?",
    keywords: ["agent", "agents", "investigator", "operator", "claude", "code", "role", "roles", "bot", "bots"],
    answer: [
      "@investigator is read-only. It finds what broke and why, proves every claim with a link, finds who owns what, and hands a numbered plan to @operator.",
      "@operator only runs steps a person approved, one at a time, checks each result, stops on the first failure, and writes the incident log.",
      "Both are Claude Code sessions, each in its own folder with its own CLAUDE.md and permission settings.",
    ],
    link: { label: "The agents' instructions", href: `${REPO}/tree/main/agents` },
    next: ["keys", "cli"],
  },
  {
    id: "keys",
    question: "How do you stop the agents from doing something dangerous?",
    keywords: ["safe", "safety", "secure", "security", "two", "keys", "key", "approve", "approval", "permission", "prompt", "dangerous", "risk", "guardrail", "allow", "control"],
    answer: [
      "Every change needs two keys. Key one: the dataset's owner, a person and never an agent, approves the numbered steps in the thread. Key two: each write raises a Switch permission prompt that a person must allow.",
      "Writes are never in the agents' allowlists, and a CI test fails if one ever slips in. The investigator is also denied curl, psql, docker, file edits and web access.",
    ],
    next: ["decline", "agents"],
  },
  {
    id: "decline",
    question: "What happens if someone clicks Decline?",
    keywords: ["decline", "declined", "deny", "denied", "reject", "refuse", "no", "stop", "wrong"],
    answer: [
      "The operator stops, says so in the thread, and does not try another way to make the same change. Nothing happens without a person allowing it.",
    ],
    next: ["keys"],
  },
  {
    id: "owner",
    question: "Why does a missing owner matter?",
    keywords: ["owner", "ownership", "owned", "unowned", "nobody", "missing", "datahub", "governance", "catalog"],
    answer: [
      "When a table has no owner, every incident starts with a hunt for someone who can approve a fix. The investigator treats a missing owner as a finding, not a footnote: it asks the room and suggests the likeliest group from DataHub.",
      "Once SAV accepts, the operator records Data Platform as the owner in DataHub, so the next incident starts with a name.",
    ],
    next: ["how", "scenario"],
  },
  {
    id: "scenario",
    question: "What exactly breaks in the demo?",
    keywords: ["scenario", "break", "breaks", "broken", "fail", "fails", "failure", "demo", "products", "deleted", "validate", "orders", "pipeline", "error"],
    answer: [
      "An upstream cleanup deletes three products that orders still use. The nightly retail_analytics_pipeline then fails at validate_orders, so the revenue table goes stale.",
      "`ownerless scenario reset`, `break` and `trigger` stage it the same way before every take. Both agents are denied those commands.",
    ],
    link: { label: "scenario/README.md", href: `${REPO}/tree/main/scenario` },
    next: ["fk", "how"],
  },
  {
    id: "fk",
    question: "Why does the scenario drop a foreign key?",
    keywords: ["foreign", "key", "fk", "constraint", "drop", "dropped", "postgres", "orphan", "orphaned"],
    answer: [
      "The demo Postgres enforces orders → products, so the delete would be refused. Most lakes and warehouses (Snowflake, BigQuery, Hive/Trino) don't enforce foreign keys, which is exactly how orphaned rows reach a pipeline. `break` drops the constraint to behave like them, and `reset` puts it back.",
    ],
    next: ["scenario"],
  },
  {
    id: "cli",
    question: "What is the ownerless CLI?",
    keywords: ["cli", "tool", "tools", "command", "commands", "python", "ownerless", "mcp", "json", "api"],
    answer: [
      "It's the agents' only tool: a small Python CLI that wraps Airflow, DataHub, Postgres and Cognee and prints JSON with a link for every entity.",
      "We chose a CLI over MCP servers because Claude Code's permission rules match command prefixes, so one rule per command decides exactly what needs a person. Every command is also something a human can run and test.",
    ],
    link: { label: "tools/README.md", href: `${REPO}/tree/main/tools` },
    next: ["keys", "stack"],
  },
  {
    id: "stack",
    question: "What is the architecture?",
    keywords: ["architecture", "stack", "systems", "airflow", "postgres", "cognee", "diagram", "design", "built", "tech", "technology", "backend", "frontend"],
    answer: [
      "Discord ↔ Switch Console → two Claude Code agents → the ownerless CLI → Airflow 3.3, DataHub, a Postgres warehouse and Cognee memory.",
      "There is no server of our own. Switch is the interface, Claude Code is the reasoning, and the CLI is the only code that touches the data platform.",
    ],
    link: { label: "docs/architecture.md", href: `${REPO}/blob/main/docs/architecture.md` },
    next: ["cli", "memory"],
  },
  {
    id: "memory",
    question: "What does Cognee do here?",
    keywords: ["cognee", "memory", "remember", "graph", "knowledge", "ask", "llm"],
    answer: [
      "Cognee holds a joined memory of Airflow and DataHub, from the data stack we built earlier. The investigator can ask it questions that need both systems, like which tasks read a table and who owns what depends on it. It's optional: if it is slow, the investigator moves on.",
    ],
    next: ["stack"],
  },
  {
    id: "run",
    question: "How do I run it myself?",
    keywords: ["run", "install", "setup", "start", "requirements", "need", "docker", "quickstart", "local", "try", "clone", "deploy", "windows", "mac", "linux"],
    answer: [
      "You need Docker, uv, the DataHub CLI and Switch Console with Claude Code. Windows (Git Bash), macOS and Linux all work.",
      "Clone with submodules, run `datahub docker quickstart`, then `scripts/setup.sh`, `scripts/up.sh --seed` and `scripts/preflight.sh`. Create the room from switch/ownerless.template.yaml, stage the incident with `ownerless scenario reset`, `break` and `trigger`, and mention @investigator.",
    ],
    link: { label: "Full instructions", href: `${REPO}#run-it` },
    next: ["template", "scenario"],
  },
  {
    id: "template",
    question: "How do I create the room from the template?",
    keywords: ["template", "yaml", "create", "room", "kickoff", "instructions", "directory", "documents", "configure", "config"],
    answer: [
      "In Switch Console: Your Rooms → Create from template → switch/ownerless.template.yaml. You pick the repository folder and the dataset owner, and one run creates both agents, the #retail-incidents room, its rules, a group directory and a kickoff where both agents introduce themselves.",
    ],
    link: { label: "switch/README.md", href: `${REPO}/tree/main/switch` },
    next: ["switch", "run"],
  },
  {
    id: "discord",
    question: "Why Discord?",
    keywords: ["discord", "slack", "mattermost", "chat", "messaging", "bridge", "channel"],
    answer: [
      "Switch connects outward to Discord, so both of us can join from our own machines and nothing is exposed. The bundled Mattermost works too.",
    ],
    next: ["switch"],
  },
  {
    id: "team",
    question: "Who built it?",
    keywords: ["who", "team", "built", "authors", "author", "jars", "sav", "people", "humans", "made", "creators"],
    answer: [
      "JARS and SAV, for the Flip the Switch Hackathon 2026, in the Best Business Workflow track. In the demo JARS is the on-call engineer and SAV is the Data Platform lead.",
    ],
    link: { label: "GitHub", href: REPO },
    next: ["reused", "hackathon"],
  },
  {
    id: "reused",
    question: "What did you reuse, and what is new?",
    keywords: ["reuse", "reused", "new", "prior", "previous", "earlier", "original", "from", "scratch"],
    answer: [
      "Reused, unchanged: our earlier data stack (demo Airflow, warehouse, DataHub seed, Cognee memory) as a pinned submodule, plus the report shape and DataHub query shapes from datahub-ai-rca. Both are our earlier projects.",
      "New for the hackathon: the Switch template and room design, both agents' roles and permissions, the ownerless CLI with its gated writes, the staged incident, the scripts and the two-key workflow.",
    ],
    next: ["team"],
  },
  {
    id: "hackathon",
    question: "Which hackathon is this for?",
    keywords: ["hackathon", "submission", "track", "judging", "wemakedevs", "flip", "contest", "competition"],
    answer: ["The Flip the Switch Hackathon 2026 by WeMakeDevs and Switch, Best Business Workflow track."],
    link: { label: "Hackathon page", href: "https://www.wemakedevs.org/hackathons/switch" },
    next: ["team", "what"],
  },
  {
    id: "video",
    question: "Where is the demo video?",
    keywords: ["video", "youtube", "watch", "recording", "demo"],
    answer: ["It's in the Demo section of this page as soon as it's published, and linked from the README."],
    next: ["how"],
  },
  {
    id: "license",
    question: "What's the license?",
    keywords: ["license", "licence", "apache", "open", "source", "free", "commercial"],
    answer: [
      "Apache License 2.0. Switch itself is Apache 2.0 with the Commons Clause; Ownerless uses it as installed software and includes none of its code.",
    ],
    link: { label: "NOTICE", href: `${REPO}/blob/main/NOTICE` },
  },
  {
    id: "companion",
    question: "Are you an AI?",
    keywords: ["you", "ai", "bot", "companion", "gpt", "real", "human", "live", "model"],
    answer: [
      "I'm a small guide that runs entirely in your browser and answers from the project's docs. No AI model, no data sent anywhere. For anything I can't answer, the README has the full story.",
    ],
    link: { label: "README", href: REPO },
  },
];

export const starters = ["what", "how", "keys", "run"];

export const greeting =
  "Hi! I'm the Ownerless guide. Ask me how the incident plays out, how the agents are kept safe, or how to run it.";
