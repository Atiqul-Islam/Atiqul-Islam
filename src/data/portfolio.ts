/**
 * The portfolio's content, kept in one place so the page is a rendering of the
 * record rather than a place where claims get invented.
 *
 * Two rules bind everything below.
 *
 * Every project carries a status from a fixed vocabulary. "Production", "beta",
 * "active development" and "paused" mean different things, and a reader who
 * cannot tell them apart cannot trust any of them.
 *
 * Employer work is described without naming a customer and without linking code
 * that is not mine to link. That constraint is why the descriptions lead with
 * what the work did rather than who it was for.
 */

export type Status =
  | "production"
  | "beta production"
  | "beta"
  | "in use"
  | "shipped"
  | "active development"
  | "prototype"
  | "paused"
  | "planned";

export const STATUS_TONE: Record<Status, string> = {
  production: "bg-primary-box text-on-primary-box",
  "beta production": "bg-primary-box text-on-primary-box",
  beta: "bg-primary-box text-on-primary-box",
  "in use": "bg-primary-box text-on-primary-box",
  shipped: "bg-primary-box text-on-primary-box",
  "active development": "bg-accent-box text-on-accent-box",
  prototype: "bg-accent-box text-on-accent-box",
  paused: "bg-accent-box text-on-accent-box",
  planned: "bg-accent-box text-on-accent-box",
};

export interface Work {
  id: string;
  name: string;
  where: string;
  status: Status;
  /** The one line that makes a reader decide whether to read the rest. */
  lead: string;
  body: string;
  role: string;
  chips: string[];
  links?: { label: string; href: string }[];
  /** Names a background scene to draw while this card is on screen. */
  scene?: string;
  /** Extra height, so a longer background beat has room to play out. */
  dwell?: boolean;
}

export const WORK: Work[] = [
  {
    id: "zero-code",
    name: "Zero code model workflow",
    where: "Instrumar",
    status: "production",
    lead: "People who do not write code ship production ML models through it.",
    body: "I designed and built a workflow that lets analysts and systems engineers build, validate and ship production models themselves. Some of the models built through it run in production today. The rest are built and in testing. The outcome is the point: domain experts ship without a developer in the loop, which is a different thing from making a developer faster.",
    role: "Designed and built it",
    chips: ["Python", "MLOps", "Kubernetes", "GitOps"],
  },
  {
    id: "platform",
    scene: "platform",
    name: "Private Kubernetes platform",
    where: "Instrumar",
    status: "beta production",
    lead: "I specified and built a private cluster, and ran it in beta production.",
    body: "A private Kubernetes cluster on Apache CloudStack using Cluster API, covering hardware, network architecture, deployment and production operations. GitOps delivery with Helm and Kustomize, automated promotion, rollback and release auditability. A parallel AWS cluster was run alongside it purely to benchmark cost against performance. It reached beta production and was then scrapped when the client and the funding went under the tariff climate, which is a business outcome rather than anything the platform did.",
    role: "Sole owner, hardware to operations",
    chips: ["Kubernetes", "Cluster API", "Apache CloudStack", "AWS"],
  },
  {
    id: "analytics",
    name: "Agentic analytics for plant operations",
    where: "Instrumar",
    status: "production",
    lead: "Ask in plain English, get SQL, charts and reports off live sensor data.",
    body: "Full stack ownership across a React interface and an async Python and FastAPI backend over WebSockets, with a supervisor routing four specialist agents on LangGraph. I engineered its context management: knowledge modules loaded on demand instead of carried, a token budget split so the stable prompt stays cached, and history compaction that keeps metadata and drops payload until a result is actually needed.",
    role: "Designed and delivered end to end",
    chips: ["React", "FastAPI", "WebSockets", "LangGraph"],
  },
  {
    id: "killick",
    scene: "embedded",
    name: "Killick-1 CubeSat",
    where: "Memorial University · capstone",
    status: "shipped",
    lead: "Comms flight software for a CubeSat that reached orbit.",
    body: "Mission Control Subsystem work in embedded C on FreeRTOS, against an MSP430 class on board computer: RTOS task design, I2C and SPI peripherals, FRAM storage, and the failure handling a system gets when nobody can go and reboot it. It is the one thing on this page where the deployment target was orbit.",
    role: "Capstone. Embedded C and RTOS",
    chips: ["Embedded C", "FreeRTOS", "MSP430", "I2C / SPI"],
  },
  {
    id: "greenhouse",
    name: "Greenhouse monitoring and a licensed tunnel",
    where: "Independent",
    status: "shipped",
    lead: "Ran unattended in a working greenhouse for over six months, as a paid product.",
    body: "Sensor data collection and a Flask application for the monitoring side, plus a licence gated tunnel written in Go so a grower could reach it from outside the site. Small, unglamorous, and it ran unattended for months, which is a different bar from a demo.",
    role: "Built and operated it",
    chips: ["Go", "Flask", "IoT", "SQLite"],
  },
  {
    id: "dotnet",
    name: "Legacy .NET and C++ systems",
    where: "Instrumar",
    status: "production",
    lead: "Extending a decades old .NET and C++ codebase without breaking it.",
    body: "APIs and background workers hardened for reliability, plus a from scratch C# network service that solves BinaryFormatter type identity parity across a .NET Remoting boundary. That last one is the kind of problem you cannot reason your way around without knowing .NET serialization internals, and it is why I am comfortable in code older than most of the tooling around it.",
    role: "Wrote it myself",
    chips: ["C#", ".NET", "C++", ".NET Remoting"],
  },
  {
    id: "jivly",
    name: "Jivly",
    where: "Personal",
    status: "active development",
    lead: "A cross platform AI wellness coach, on my own orchestration library.",
    body: "React Native and Expo across Android, iOS and web, on an async Python and FastAPI backend over Server Sent Events. The agent layer runs on GraphCrew in a hub and spoke topology with pluggable domain agents, which is where a lot of GraphCrew's middleware requirements were found. It is a wellness product, not a medical or diagnostic one.",
    role: "Sole author",
    chips: ["React Native", "Expo", "FastAPI", "SSE"],
  },
  {
    id: "streaming",
    name: "Model deployment and data streaming",
    where: "Instrumar",
    status: "production",
    lead: "An event driven Go orchestrator and a plugin based routing framework.",
    body: "The Go orchestrator handles deployment, versioning, health and legacy integration for multi model Python pipelines. The routing framework exposes multi source sensor data to legacy applications, with new sources and sinks added as plugins rather than as forks. Apache Pulsar underneath, and serverless endpoints and scheduled batch jobs on AWS Lambda and SageMaker for the experimental pipelines.",
    role: "Designed and built both",
    chips: ["Go", "Apache Pulsar", "gRPC", "AWS Lambda"],
  },
  {
    id: "genesis",
    scene: "acts",
    dwell: true,
    name: "Genesis",
    where: "Open source · MIT",
    status: "beta",
    lead: "An agent builder that makes an agent provably apply its expertise.",
    body: "An LLM agent can hold an instruction in its context and still not apply it. Genesis moves enforcement outside the model: expertise is decomposed into rules with stable IDs, and the checkable ones compile into fail closed hooks that deny a write breaking one and refuse to let the agent finish until it cites the rules it applied with evidence. Three Rust crates, a Model Context Protocol server, local ONNX embeddings and SQLite vector search, fully offline. It is self hosting, and agents built with it work as the engineers on live systems.",
    role: "Sole author, 17 releases",
    chips: ["Rust", "MCP", "ONNX", "SQLite vector search"],
    links: [
      { label: "Code", href: "https://github.com/Atiqul-Islam/genesis" },
      { label: "Docs", href: "https://atiqul-islam.github.io/genesis/" },
    ],
  },
  {
    id: "graphcrew",
    name: "GraphCrew",
    where: "Open source · MIT · PyPI",
    status: "beta",
    lead: "LangGraph with the context and token management already in place.",
    body: "LangGraph gives you the graph. It does not decide how much context each agent gets, when to evict a knowledge slot, or how to stop one tenant spending another tenant's budget. GraphCrew ships those as defaults: a tiered slot manager with eviction, an explicit token budget, multi pass ReAct, pluggable persistence, circuit breaking, per tenant rate limiting and OpenTelemetry tracing, with a MockLLM subpackage so agent graphs can be tested without a live model call.",
    role: "Sole author",
    chips: ["Python", "LangGraph", "Tiered slots", "OpenTelemetry"],
    links: [
      { label: "Code", href: "https://github.com/Atiqul-Islam/graphcrew" },
      { label: "PyPI", href: "https://pypi.org/project/graphcrew/" },
    ],
  },
  {
    id: "commune",
    name: "commune",
    where: "Open source for Instrumar",
    status: "beta",
    lead: "Drive any terminal coding agent over a real pseudo terminal.",
    body: "It spawns the agent, forwards input unchanged, and renders output through a terminal emulator into clean frames a human watches live and a bot reads as text. Windows first over ConPTY, cross platform through portable-pty. Dual mode: interactive for a person, plus an MCP over Streamable HTTP server managing many agents at once. Its WinRM installer has been used to put it on a remote host as one self contained executable.",
    role: "Sole author. Beta, in use",
    chips: ["Rust", "ConPTY", "MCP over HTTP", "axum"],
  },
  {
    id: "cert-tracker",
    name: "AMS AI Solutions",
    where: "My own venture, with Maxwell Patten",
    status: "prototype",
    lead: "A venture I started outside a day job, and architected myself.",
    body: "My idea, and I managed, designed and architected it, with Maxwell bringing the client. cert-tracker is the deliverable, a FastAPI certificate expiry API. It stalled at MVP and I am not going to describe it as more than that. What it is evidence of is the other half of the job: deciding what to build and owning that decision, rather than being handed a spec.",
    role: "My idea, my architecture",
    chips: ["FastAPI", "Python", "Client delivery", "Architecture"],
  },
  {
    id: "vocalize",
    name: "vocalize",
    where: "Open source",
    status: "active development",
    lead: "Offline text to speech in Rust. No network call, no third party API.",
    body: "ONNX Runtime and the Kokoro model, exposed to Python through PyO3. The work covers the inference path end to end: model loading, tokenisation, audio synthesis and the binding layer.",
    role: "Sole author",
    chips: ["Rust", "ONNX Runtime", "PyO3", "Kokoro"],
    links: [{ label: "Code", href: "https://github.com/Atiqul-Islam/vocalize" }],
  },
];

export interface Role {
  title: string;
  org: string;
  when: string;
  note?: string;
}

/** Taken from the confirmed record, titles and dates exactly as they read. */
export const EXPERIENCE: Role[] = [
  {
    title: "Software Developer",
    org: "Instrumar",
    when: "Jun 2022 to present",
    note: "Agent infrastructure, MLOps, and the platform underneath.",
  },
  { title: "Software Developer, co-op", org: "Instrumar", when: "Sep to Dec 2021" },
  { title: "Software Developer, co-op", org: "Instrumar", when: "Jan to Apr 2021" },
  { title: "Analyst Developer, co-op", org: "InnovMarine", when: "May to Aug 2020" },
  { title: "Analyst Developer, contract", org: "InnovMarine", when: "Jan to Apr 2020" },
  { title: "Junior Technical Support and Developer", org: "InnovMarine", when: "Sep to Dec 2019" },
  { title: "Engineering Work Term Student", org: "Memorial University", when: "Feb to May 2018" },
];

export const CAPABILITIES = [
  {
    title: "Agent infrastructure",
    body: "Orchestration, enforcement and memory. Two published libraries, and agents running on live systems.",
  },
  {
    title: "Platform and MLOps",
    body: "Kubernetes on Apache CloudStack, specified and built from the hardware up and run in production.",
  },
  {
    title: "Full stack product",
    body: "React and async Python over WebSockets, shipped to people who use it daily.",
  },
  {
    title: "Context engineering",
    body: "On demand knowledge loading, cache aware token budgets, history compaction.",
  },
];

/** The Genesis deep dive, kept as one section rather than the spine of the page. */
export const ACTS = [
  {
    id: "act-terminal",
    label: "01",
    title: "It starts with an install.",
    body: "Genesis installs from the terminal, and the first agent comes out with its rules already compiled into hooks.",
  },
  {
    id: "act-team",
    label: "02",
    title: "That agent builds the next ones.",
    body: "Checkable rather than claimed: Genesis is self hosting, so an agent it made builds the rest.",
  },
  {
    id: "act-deploy",
    label: "03",
    title: "Then it goes somewhere real.",
    body: "It ships to AWS on EKS with the delivery every other service gets, rollback included.",
  },
  {
    id: "act-phone",
    label: "04",
    title: "Someone asks for something, from a phone.",
    body: "No dashboard, no ticket form. A message in a chat app, turned into a task the system routes.",
  },
  {
    id: "act-task",
    label: "05",
    title: "An autonomous agentic system.",
    body: "A write is denied by a rule it broke, the agent cites the rule with evidence, tests pass, it merges.",
  },
];

export const STACK: [string, string[]][] = [
  ["Languages", ["Rust", "Python", "Go", "TypeScript", "C#"]],
  ["Agents and LLM", ["LangGraph", "MCP", "Context engineering", "ReAct", "RAG", "Evaluation"]],
  ["Platform", ["Kubernetes", "Cluster API", "Apache CloudStack", "AWS", "Helm", "Kustomize"]],
  ["Data and ops", ["PostgreSQL", "TimescaleDB", "Apache Pulsar", "Trino", "Prometheus", "OpenTelemetry"]],
];
