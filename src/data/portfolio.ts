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

export type Status = "production" | "beta" | "in use" | "active development" | "shipped";

export const STATUS_TONE: Record<Status, string> = {
  production: "bg-primary-box text-on-primary-box",
  beta: "bg-primary-box text-on-primary-box",
  "in use": "bg-primary-box text-on-primary-box",
  shipped: "bg-primary-box text-on-primary-box",
  "active development": "bg-accent-box text-on-accent-box",
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
  /** Flagship items get the wide treatment. */
  feature?: boolean;
}

export const WORK: Work[] = [
  {
    id: "zero-code",
    name: "Zero code model workflow",
    where: "Instrumar",
    status: "production",
    feature: true,
    lead: "People who do not write code ship production machine learning models through it.",
    body: "I designed and built a workflow that lets analysts and systems engineers build, validate and ship production models themselves. Some of the models built through it run in production today. The rest are built and in testing. The outcome is the point: domain experts ship without a developer in the loop, which is a different thing from making a developer faster.",
    role: "Designed and built it, and own the platform it runs on",
    chips: ["Python", "MLOps", "Kubernetes", "GitOps", "Non programmer operated"],
  },
  {
    id: "platform",
    name: "Private Kubernetes platform",
    where: "Instrumar",
    status: "production",
    lead: "Specified, built and operate the cluster the models run on.",
    body: "A private Kubernetes cluster on Apache CloudStack using Cluster API, covering hardware, network architecture, deployment and production operations. GitOps delivery with Helm and Kustomize, automated promotion, rollback and release auditability. A parallel AWS cluster was run alongside it to benchmark cost against performance.",
    role: "Sole owner, from hardware to production operations",
    chips: ["Kubernetes", "Cluster API", "Apache CloudStack", "AWS", "Helm", "Kustomize"],
  },
  {
    id: "analytics",
    name: "Agentic analytics for plant operations",
    where: "Instrumar",
    status: "production",
    lead: "Ask in plain English, get SQL, charts and reports off live sensor data.",
    body: "Full stack ownership across a React interface and an async Python and FastAPI backend over WebSockets, with a supervisor routing four specialist agents on LangGraph. I engineered its context management: knowledge modules loaded on demand instead of carried, a token budget split so the stable prompt stays cached, and history compaction that keeps metadata and drops payload until a result is actually needed.",
    role: "Designed and delivered it end to end",
    chips: ["React", "FastAPI", "WebSockets", "LangGraph", "Context engineering", "TimescaleDB"],
  },
  {
    id: "killick",
    name: "Killick-1 CubeSat",
    where: "Memorial University · capstone",
    status: "shipped",
    feature: true,
    lead: "Comms flight software for a satellite that launched to the ISS and reached orbit.",
    body: "Mission Control Subsystem work in embedded C on FreeRTOS, against an MSP430 class on board computer: RTOS task design, I2C and SPI peripherals, FRAM storage, and the failure handling a system gets when nobody can go and reboot it. It is the one thing on this page where the deployment target was orbit.",
    role: "Capstone. Embedded C and RTOS design",
    chips: ["Embedded C", "FreeRTOS", "MSP430", "I2C / SPI", "FRAM", "Flight software"],
  },
  {
    id: "greenhouse",
    name: "Greenhouse monitoring and a licensed tunnel",
    where: "Independent",
    status: "shipped",
    lead: "Ran for over six months in a working greenhouse, as a paid product.",
    body: "Sensor data collection and a Flask application for the monitoring side, plus a licence gated tunnel written in Go so a grower could reach it from outside the site. Small, unglamorous, and it ran unattended for months, which is a different bar from a demo.",
    role: "Built and operated it",
    chips: ["Go", "Flask", "IoT", "SQLite", "Deployed and billed"],
  },
  {
    id: "dotnet",
    name: "Legacy .NET and C++ systems",
    where: "Instrumar",
    status: "production",
    lead: "Extending a decades old .NET and C++ codebase without breaking what runs on it.",
    body: "APIs and background workers hardened for reliability, plus a from scratch C# network service that solves BinaryFormatter type identity parity across a .NET Remoting boundary. That last one is the kind of problem you cannot reason your way around without knowing .NET serialization internals, and it is why I am comfortable in code older than most of the tooling around it.",
    role: "Wrote it myself",
    chips: ["C#", ".NET", "C++", ".NET Remoting", "Interop"],
  },
  {
    id: "jivly",
    name: "Jivly",
    where: "Personal",
    status: "active development",
    lead: "A cross platform AI wellness coach, built on my own orchestration library.",
    body: "React Native and Expo across Android, iOS and web, on an async Python and FastAPI backend over Server Sent Events. The agent layer runs on GraphCrew in a hub and spoke topology with pluggable domain agents, which is where a lot of GraphCrew's middleware requirements were found. It is a wellness product, not a medical or diagnostic one.",
    role: "Sole author",
    chips: ["React Native", "Expo", "FastAPI", "SSE", "GraphCrew"],
  },
  {
    id: "streaming",
    name: "Model deployment and data streaming",
    where: "Instrumar",
    status: "production",
    lead: "An event driven Go orchestrator and a plugin based routing framework for multi source sensor data.",
    body: "The Go orchestrator handles deployment, versioning, health and legacy integration for multi model Python pipelines. The routing framework exposes multi source sensor data to legacy applications, with new sources and sinks added as plugins rather than as forks. Apache Pulsar underneath, and serverless endpoints and scheduled batch jobs on AWS Lambda and SageMaker for the experimental pipelines.",
    role: "Designed and built both",
    chips: ["Go", "Apache Pulsar", "gRPC", "AWS Lambda", "SageMaker"],
  },
  {
    id: "genesis",
    name: "Genesis",
    where: "Open source · MIT",
    status: "beta",
    feature: true,
    lead: "An agent builder that makes an agent provably apply its expertise.",
    body: "An LLM agent can hold an instruction in its context and still not apply it. Genesis moves enforcement outside the model: expertise is decomposed into rules with stable IDs, and the checkable ones compile into fail closed hooks that deny a write breaking one and refuse to let the agent finish until it cites the rules it applied with evidence. Three Rust crates, a Model Context Protocol server, local ONNX embeddings and SQLite vector search, fully offline. It is self hosting, and agents built with it work as the engineers on live systems.",
    role: "Sole author. 17 releases",
    chips: ["Rust", "MCP", "ONNX", "SQLite vector search", "Self hosting"],
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
    lead: "LangGraph with the best practices, context management and token management already in place.",
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
    status: "in use",
    lead: "Drive any terminal based coding agent over a real pseudo terminal, with no cooperation from the agent.",
    body: "It spawns the agent, forwards input unchanged, and renders output through a terminal emulator into clean frames a human watches live and a bot reads as text. Windows first over ConPTY, cross platform through portable-pty. Dual mode: interactive for a person, plus an MCP over Streamable HTTP server managing many agents at once. Its WinRM installer has been used to put it on a remote host as one self contained executable.",
    role: "Sole author",
    chips: ["Rust", "ConPTY", "MCP over HTTP", "axum", "tokio"],
  },
  {
    id: "cert-tracker",
    name: "AMS AI Solutions",
    where: "My own venture, with Maxwell Patten",
    status: "shipped",
    lead: "Client software built outside a day job, from my idea through to delivery.",
    body: "My idea, and I managed, designed and architected it. cert-tracker is the deliverable, a FastAPI service built for a client's business. The interesting part was not the stack: it was owning the thing end to end, from deciding what to build through to what shipped.",
    role: "Idea, architecture and delivery lead",
    chips: ["FastAPI", "Python", "Client delivery", "Architecture"],
  },
  {
    id: "vocalize",
    name: "vocalize",
    where: "Open source",
    status: "active development",
    lead: "Offline text to speech in Rust, with no network call and no third party speech API.",
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
    note: "Agent infrastructure, MLOps, and the platform underneath. Full time.",
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
    body: "Orchestration, enforcement, evaluation and memory. Two published libraries, and agents that work as engineers on live systems.",
  },
  {
    title: "Platform and MLOps",
    body: "A private Kubernetes cluster I specified, built and operate, with GitOps delivery, automated promotion, rollback and release auditability.",
  },
  {
    title: "Full stack product",
    body: "React and async Python over WebSockets, shipped to people who use it daily and judge it on whether it answers their question.",
  },
  {
    title: "Context engineering",
    body: "On demand knowledge loading, cache aware token budgets and history compaction, designed for a product in production rather than a benchmark.",
  },
];

/** The Genesis deep dive, kept as one section rather than the spine of the page. */
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

export const STACK: [string, string[]][] = [
  ["Languages", ["Rust", "Python", "Go", "TypeScript", "C#"]],
  ["Agents and LLM", ["LangGraph", "MCP", "Context engineering", "ReAct", "RAG", "Evaluation"]],
  ["Platform", ["Kubernetes", "Cluster API", "Apache CloudStack", "AWS", "Helm", "Kustomize"]],
  ["Data and ops", ["PostgreSQL", "TimescaleDB", "Apache Pulsar", "Trino", "Prometheus", "OpenTelemetry"]],
];
