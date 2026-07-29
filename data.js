// ─────────────────────────────────────────────────────────────
//  PIPELINE MANIFEST — the DAG that renders this site
// ─────────────────────────────────────────────────────────────

export const PROFILE = {
  name: "Linus Dominic Nathaniel",
  role: "Lead Data Engineer / Data Architect",
  email: "linusnathaniel@gmail.com",
  phone: "+92 323 213 2371",
  linkedin: "https://www.linkedin.com/in/linus-dominic/",
  github: "https://github.com/linusdominic",
  location: "Karachi, Pakistan",
  status: "Open to EU relocation (visa sponsorship required) · also EU-remote",
  tagline:
    "I turn fragmented operational systems into governed, queryable sources of truth.",
  summary:
    "Lead Data Engineer and Data Architect with 6+ years designing data platforms end-to-end — from source-system contracts and domain modeling through ingestion, transformation, BI and stakeholder enablement. Currently leading a team of 4–6 engineers at Altair Capital Group, where I own the data architecture for a US real-estate finance firm.",
  stats: [
    { k: "years_experience", v: 6, suffix: "+" },
    { k: "entities_modeled", v: 2, suffix: "M" },
    { k: "engineers_led", v: 6, suffix: "" },
    { k: "pipelines_owned", v: 29, suffix: "+" },
  ],
};

// type: source | transform | warehouse | serve | ai | lead
export const NODES = [
  {
    id: "bleed",
    label: "Bleed AI",
    sub: "Lead Support Eng. / Data Analyst",
    type: "source",
    layer: 0,
    period: "Dec 2019 – Nov 2021",
    place: "Karachi, Pakistan",
    kind: "role",
    tags: ["Computer Vision", "Python", "Data Analysis"],
    body: [
      "Led data analysis for computer-vision projects, refining models for higher image-recognition accuracy.",
      "Optimized data pipelines, improving processing speed while holding data integrity.",
      "First taste of owning a delivery surface end-to-end — and of leading other engineers through it.",
    ],
  },
  {
    id: "arpatech",
    label: "Arpatech",
    sub: "Data & ML Engineer",
    type: "source",
    layer: 0,
    period: "Jan 2022 – Jun 2023",
    place: "Karachi, Pakistan",
    kind: "role",
    badge: "MARKETPLACE",
    tags: ["Marketplace", "Elasticsearch", "IoT", "Product"],
    body: [
      "Engineered the Custom Data Insights platform for the <b>Connection Cloud Marketplace</b> — a multi-vendor cloud-services marketplace — delivering interactive spend and comparative-analysis visualisations for buyers and vendors.",
      "Built an Elasticsearch + Kibana querying app for the sales team, improving retrieval speed ~50%.",
      "Shipped a Smart Mirror IoT product for facial-recognition attendance, cutting manual tracking error.",
    ],
  },
  {
    id: "pureharvest",
    label: "Pure Harvest",
    sub: "Data Engineer",
    type: "transform",
    layer: 1,
    period: "Jun 2023 – May 2025",
    place: "Remote · Smart Farms",
    kind: "role",
    badge: "PRODUCT CO.",
    tags: ["PySpark", "AWS Glue", "Medallion", "Redshift"],
    body: [
      "Product-based agri-tech company. Designed and deployed custom ETL on PySpark and AWS Glue, cutting processing time ~30%.",
      "Automated multi-source ingestion into a centralised AWS data lake, widening the analytics surface for operations and growers.",
      "Implemented Medallion architecture (bronze / silver / gold) on a Redshift lakehouse — modeling, governance, performance tuning.",
      "Built interactive operational dashboards in Apache Superset across cultivation and supply chain.",
    ],
  },
  {
    id: "venturedive",
    label: "VentureDive",
    sub: "Senior Data Engineer",
    type: "transform",
    layer: 1,
    period: "Jun 2025 – Dec 2025",
    place: "Karachi, Pakistan",
    kind: "role",
    tags: ["Airflow", "dbt", "Terraform", "Multi-cloud"],
    body: [
      "Led migration of the team's ETL platform from Talend to Apache Airflow — new standards for scheduling, observability and Git-based DAG versioning; cut average runtime and on-call paging through parallelism redesign and SLA monitoring.",
      "Established the modern data stack reference architecture (Airflow + dbt + warehouse) as the team-wide standard.",
      "Defined the multi-cloud deployment standard (Terraform + GitHub Actions) across AWS, GCP and Azure engagements.",
      "Mentored junior engineers; codified Airflow patterns, review and DAG-testing practice as team norms.",
    ],
  },
  {
    id: "altair",
    label: "Altair Capital Group",
    sub: "Lead Data Engineer / Data Architect",
    type: "lead",
    layer: 2,
    period: "Dec 2025 – Present",
    place: "Remote · US real-estate finance",
    kind: "role",
    badge: "LEADING 4–6",
    current: true,
    tags: ["Leadership", "Architecture", "AWS", "Superset", "LLM"],
    body: [
      "<b>Lead a team of 4–6 engineers</b> across data platform, BI and integrations — sprint planning, architecture review, code review, hiring input and direct mentorship. I set the technical standards the team builds against.",
      "Designed the firm's unified customer-journey domain model, reconciling three external source systems (parquet data lake, dialer logs, CRM) into a phone-keyed six-stage funnel across <b>~2M entities</b> — now the single source of truth for BI and operations.",
      "Re-architected the production data lake on AWS S3: canonical zoning, partitioning and cataloguing across <b>~29 ingestion and transformation jobs</b>; eliminated long-standing duplication.",
      "Delivered the cross-system reconciliation framework between the loan-origination platform and the warehouse, surfacing data-quality gaps invisible to operations.",
      "Owned an internal loan-pricing platform end-to-end — requirements, modeling, calculation engine, CRM integration, term-sheet generation — for Bridge and DSCR products.",
    ],
  },
  {
    id: "journey",
    label: "Customer Journey Model",
    sub: "Unified domain model · ~2M entities",
    type: "warehouse",
    layer: 3,
    kind: "project",
    period: "Altair Capital Group",
    tags: ["Kimball", "Conformed Dims", "Data Contracts"],
    body: [
      "The firm's single source of truth for the customer lifecycle. Three external systems — a parquet data lake, dialer logs and the CRM — modeled onto a phone-keyed, six-stage funnel spanning roughly two million entities.",
      "Defined the conformed dimensions and bridge contracts that every downstream dashboard and operational process now reads from.",
      "The hard part was not the volume. It was reconciling three systems that each believed they owned the customer.",
    ],
  },
  {
    id: "aitm",
    label: "AI Conversation Intelligence",
    sub: "LLM layer behind AI-TM agent",
    type: "ai",
    layer: 3,
    kind: "project",
    period: "Altair Capital Group",
    tags: ["LLM", "AWS Lambda", "Prompt Engineering", "Event-driven"],
    body: [
      "Architected the conversation-analysis system powering the firm's AI Telemarketing agent: an LLM-driven Meaningful Conversation detector plus a role-aware call-note generator that writes structured insight back into CRM Leads and Contacts.",
      "Notes are generated differently for a Loan Officer, a Processor and the CCO — same call, three audiences, three summaries.",
      "Built event-driven on AWS Lambda with retry logic, race-condition handling and CloudWatch anomaly alerting on SNS.",
    ],
  },
  {
    id: "superset",
    label: "Programmatic BI Platform",
    sub: "Apache Superset · BI as code",
    type: "serve",
    layer: 4,
    kind: "project",
    period: "Altair Capital Group",
    link: "https://superset.altaircapitalgroup.com/embed/psr-v2",
    linkLabel: "View live dashboard →",
    tags: ["Superset", "Jinja", "MySQL", "CI/CD"],
    body: [
      "Established the firm's BI delivery model: a version-controlled, code-deployed analytics layer built from Python, Jinja-templated MySQL views and the Superset API.",
      "Powers the Performance Score Ratings (PSR), Loan Officer pipeline and Daily Call dashboards used by sales, operations and leadership.",
      "Replaced ad-hoc dashboard clicking with reproducible, reviewable, auditable BI — dashboards ship through pull requests like everything else.",
    ],
  },
  {
    id: "voice",
    label: "Voice + CRM Integration",
    sub: "Event-driven ingestion",
    type: "serve",
    layer: 4,
    kind: "project",
    period: "Altair Capital Group",
    tags: ["Lambda", "SSM", "OAuth", "SNS"],
    body: [
      "Designed the voice and CRM integration pipeline on event-driven AWS Lambda with an S3 pending-queue pattern and shared SSM-cached OAuth tokens.",
      "Eliminated rate-limit failures at concurrent scale — the previous design burned tokens faster than the provider would mint them.",
      "Wired into CloudWatch anomaly alerting on SNS so failures page a human, not a dashboard nobody reads.",
    ],
  },
];

export const EDGES = [
  ["bleed", "pureharvest"],
  ["arpatech", "pureharvest"],
  ["arpatech", "venturedive"],
  ["pureharvest", "altair"],
  ["venturedive", "altair"],
  ["altair", "journey"],
  ["altair", "aitm"],
  ["journey", "superset"],
  ["aitm", "voice"],
  ["journey", "voice"],
  ["aitm", "superset"],
];

export const SKILLS = [
  {
    group: "Architecture & Governance",
    icon: "▤",
    items: ["Dimensional / Kimball modeling", "Data contracts", "Lineage", "MDM patterns", "Medallion architecture", "Data domains", "Conformed dimensions"],
  },
  {
    group: "Leadership",
    icon: "◈",
    items: ["Team of 4–6 engineers", "Architecture review", "Code review standards", "Mentorship", "Sprint planning", "Stakeholder enablement", "Hiring input"],
  },
  {
    group: "Orchestration & Transform",
    icon: "⟳",
    items: ["Apache Airflow", "dbt", "Prefect", "AWS Glue", "AWS Step Functions"],
  },
  {
    group: "Processing",
    icon: "⚡",
    items: ["Apache Spark", "PySpark", "Pandas", "Apache Kafka", "Hadoop"],
  },
  {
    group: "Warehouse & Lakehouse",
    icon: "▣",
    items: ["Amazon Redshift", "Google BigQuery", "Snowflake", "AWS Athena", "Databricks"],
  },
  {
    group: "AI & LLM",
    icon: "◉",
    items: ["Conversation intelligence", "LLM note generation", "Prompt engineering", "Role-aware agent design"],
  },
  {
    group: "Cloud",
    icon: "☁",
    items: ["AWS (S3, Glue, Athena, Redshift, Lambda, Step Functions, EventBridge, ECS, Fargate)", "GCP (BigQuery, Dataflow, GCS)", "Azure (Data Factory, Synapse)"],
  },
  {
    group: "Platform & DevOps",
    icon: "⬢",
    items: ["Terraform", "Docker", "GitHub Actions", "CI/CD", "MySQL", "PostgreSQL", "MongoDB", "Elasticsearch"],
  },
  {
    group: "BI & Visualization",
    icon: "▦",
    items: ["Apache Superset", "Power BI", "Grafana", "Kibana", "Streamlit"],
  },
];

export const EDUCATION = {
  degree: "BSc Computer Science",
  school: "Karachi Institute of Economics and Technology",
  period: "Aug 2018 – Aug 2022",
  certs: [
    "Certified Data Engineer — Karachi AI",
    "Certified Data Analyst — Karachi AI",
    "Computer Vision & Image Processing — Bleed AI",
  ],
  languages: ["English — Fluent", "Urdu — Native"],
};

export const TYPE_META = {
  source:    { color: "#4ea3ff", name: "SOURCE" },
  transform: { color: "#00e5a0", name: "TRANSFORM" },
  lead:      { color: "#ffb020", name: "LEAD" },
  warehouse: { color: "#c17bff", name: "WAREHOUSE" },
  ai:        { color: "#ff5f9e", name: "AI / ML" },
  serve:     { color: "#5eead4", name: "SERVE" },
};
