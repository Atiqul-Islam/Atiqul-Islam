export type Status = "beta" | "active development" | "in use" | "production";

export interface Project {
  id: string;
  name: string;
  kicker: string;
  status: Status;
  /** Why it exists, in one sentence the reader can act on. */
  thesis: string;
  body: string[];
  chips: string[];
  commands?: string[];
  links: { label: string; href: string }[];
}

/* Every status label here comes from the fixed vocabulary in the record, and
   every claim is one the repo or a confirmation backs. No launch adjectives. */
export const PROJECTS: Project[] = [
  {
    id: "genesis",
    name: "genesis",
    kicker: "Act I — building the agent",
    status: "beta",
    thesis:
      "An agent builder that makes an agent provably apply its expertise, instead of hoping it will.",
    body: [
      "An LLM agent can hold an instruction in its context and still not apply it. Writing the rule again, in bold, higher up, works until it doesn't, and from the outside you cannot tell which of those two states you are in.",
      "Genesis moves enforcement outside the model. Each expertise is decomposed into rules with stable IDs. The mechanically checkable ones compile into fail closed hooks that inject the rules before work, deny a write that breaks one, and refuse to let the agent finish until it cites the rule IDs it applied with evidence that resolves against the file it just produced. Whatever cannot be checked mechanically goes to an independent reviewer on a different model, with block only authority.",
      "Three Rust crates, a Model Context Protocol server, local ONNX embeddings pinned by revision and SHA-256, SQLite vector search, fully offline, and a memory store that supersedes facts rather than deleting them. It is self hosting: its own agents build it, under the same enforcement.",
    ],
    chips: ["Rust", "MCP server", "ONNX", "SQLite vector search", "17 releases", "MIT"],
    commands: ["/plugin marketplace add Atiqul-Islam/genesis", "/plugin install genesis@genesis"],
    links: [
      { label: "Code", href: "https://github.com/Atiqul-Islam/genesis" },
      { label: "Docs", href: "https://atiqul-islam.github.io/genesis/" },
    ],
  },
  {
    id: "graphcrew",
    name: "graphcrew",
    kicker: "Act II — orchestrating the team",
    status: "beta",
    thesis: "LangGraph with the best practices, context management and token management already in place.",
    body: [
      "GraphCrew exists so that building an LLM system on LangGraph does not mean solving the same problems again. LangGraph gives you the graph. It does not decide how much context each agent gets, when to evict a knowledge slot, what happens when a model call fails halfway through, or how to stop one tenant spending another tenant's budget.",
      "Already wired in: a tiered slot manager with eviction and an explicit token budget, multi pass ReAct with bounded passes, pluggable persistence and session backends, circuit breaking and retry with backoff, per tenant rate limiting and isolation, metrics and OpenTelemetry tracing. Crews are declared in YAML, and a MockLLM subpackage lets you test agent graphs without a single live model call.",
    ],
    chips: ["Python", "Tiered slots", "Token budget", "OpenTelemetry", "Sole author", "MIT"],
    commands: ["pip install graphcrew"],
    links: [
      { label: "Code", href: "https://github.com/Atiqul-Islam/graphcrew" },
      { label: "PyPI", href: "https://pypi.org/project/graphcrew/" },
    ],
  },
  {
    id: "commune",
    name: "commune",
    kicker: "Act II — the terminal, driven",
    status: "in use",
    thesis: "Drive any terminal based coding agent over a real pseudo terminal, with no cooperation from the agent.",
    body: [
      "It spawns the agent, forwards input unchanged, and renders output through a terminal emulator into clean frames a human watches live and a bot reads as text. Windows first over ConPTY, cross platform through portable-pty.",
      "Dual mode: an interactive mode for a person, plus an MCP over Streamable HTTP server on rmcp, axum and tokio that manages many agents at once by never reused id, exposing spawn, list, stop, send_text, press, screen and history. A WinRM remote installer puts it on a remote Windows host as one self contained executable, and that installer has been used to deploy it to a deployment system.",
    ],
    chips: ["Rust", "ConPTY", "MCP over HTTP", "portable-pty", "Open source for Instrumar"],
    links: [],
  },
  {
    id: "vocalize",
    name: "vocalize",
    kicker: "Act III — shipping the artifact",
    status: "active development",
    thesis: "Offline text to speech in Rust, with no network call and no third party speech API.",
    body: [
      "ONNX Runtime and the Kokoro model, exposed to Python through PyO3. The work covers the inference path end to end: model loading, tokenisation, audio synthesis, and the binding layer.",
    ],
    chips: ["Rust", "ONNX Runtime", "PyO3", "Kokoro", "Fully offline"],
    links: [{ label: "Code", href: "https://github.com/Atiqul-Islam/vocalize" }],
  },
];

export const ACTS = [
  {
    id: "act-terminal",
    label: "01",
    title: "It starts with an install.",
    body: "Genesis goes on from the terminal like any other plugin, and the first agent comes out of it. Its expertise is decomposed into rules with stable IDs, and the checkable ones are compiled into hooks that run outside the model. The agent is never asked to follow them.",
  },
  {
    id: "act-team",
    label: "02",
    title: "That agent builds the next ones.",
    body: "This is the part that is checkable rather than claimed: Genesis is self hosting, so an agent it produced turns around and uses Genesis to build the rest. Each new agent arrives with its own rules already compiled and its own memory that supersedes facts instead of deleting them.",
  },
  {
    id: "act-deploy",
    label: "03",
    title: "Then it goes somewhere real.",
    body: "An agent system that only runs on a laptop has not been tested. This one ships to AWS on EKS with the same delivery every other service gets: versioned, promoted, health checked, and rollable back. Getting that part right is most of the work, and it is the part nobody notices when it is done well.",
  },
  {
    id: "act-phone",
    label: "04",
    title: "Someone asks for something, from a phone.",
    body: "No terminal, no dashboard, no ticket form. A message in a chat app people already have open. The agent reads it, works out what is actually being asked, and turns it into a task the system can route. The interface is the part that decides whether anyone uses it.",
  },
  {
    id: "act-task",
    label: "05",
    title: "An autonomous agentic system.",
    body: "The supervisor routes the task to whichever agent owns it. That agent writes the change, has a write denied by a rule it broke, cites the rule with evidence that resolves against the file, passes its tests, and merges. Nothing in that loop waits on a person, and nothing in it depends on the model choosing to behave.",
  },
];
