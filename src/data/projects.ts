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
    title: "It starts in a terminal.",
    body: "One agent, built with Genesis. Its expertise is decomposed into rules with stable IDs, and the checkable ones are compiled into hooks that run outside the model. The agent does not get asked to follow them.",
  },
  {
    id: "act-team",
    label: "02",
    title: "One agent becomes a team.",
    body: "Hermes is the current version of my agent copilot, with Clippy supervising it and commune driving the terminals underneath. A supervisor routes work to specialists rather than one model trying to hold everything at once.",
  },
  {
    id: "act-task",
    label: "03",
    title: "A task arrives. An agent picks it up.",
    body: "The supervisor routes it to whichever specialist owns that work. That agent implements it under the same enforcement as everything else, cites the rules it applied, and hands the result back. That loop is the product.",
  },
];
