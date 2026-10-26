# Build the quiet back office expedition filmmakers need

**The answer:** don't build a general "personal AI". OpenAI, Google, Anthropic and Notion shipped that between September 2025 and May 2026, and the standalone devices and companion apps in the category mostly died or were acqui-hired. The niche product that works is a **production-aware, jurisdiction-aware operations layer for a travelling creator business, with a mentor layer that guards the creative core instead of automating it**. The research on delegation points one way. People want roughly half their tasks automated, chiefly the tedious ones, so they can spend the time on higher-value work. They want partnership rather than handoff, and creators keep the final creative call (85% in Adobe's 2026 survey). So the Life OS should run logistics, compliance, the pipeline and admin close to autopilot, draft every outbound message for approval, and coach story, craft and career without ever replacing them. The mentoring research adds a constraint most products ignore. AI matches humans on structured goal pursuit but not on wellbeing. Unguarded AI help degrades skill once it is removed. Sycophancy is the default failure. And the scarce career resource, sponsorship by humans, is something AI can only help you earn. Technically, that means one always-on EU hub that owns schedules and memory, with the phone and laptop as edge nodes and glasses, watch and earbuds as thin, swappable I/O. Everything talks over MCP 2026-07-28. A deterministic plane fires legal and safety deadlines without needing an LLM, and a CaMeL-style policy layer gates every send, payment and publish. On the business side, sell it the way you already sell Format Edit Systems: as a configured system on top of the big labs, a done-for-you setup plus template plus retainer, distributed by filming the build. Not as SaaS. Your real advantage is that you are the user. The trap is that the product eats the documentary career it is supposed to protect.

| Part | Recommendation in one line | Confidence |
|---|---|---|
| **A. Architecture** | EU VPS hub (durable jobs + memory + policy) over Tailscale. Phone edge app with an on-device model and offline outbox. Laptop as the production node (Resolve/Remotion/TwelveLabs via a local MCP server). Watch/earbuds for approvals. Glasses deferred, and treated as a swappable HUD when added. | High on topology. Medium on glasses timing. |
| **B. Persona & business** | Persona: the "Nomadic Creator Couple-Business" (DACH-first beachhead). Model: content-led build-in-public → €2.5–5k "Creator Ops System" setup + template SKU → €50–300/mo maintained-system retainer. No SaaS until there are 20+ paying setups. | Medium. The market is small (tens of thousands of buyers). |
| **C. Behaviour & 24/7** | 13 domains. Autonomy set per function × domain and promoted only on a track record. Four urgency tiers. About 3 pushes per person per day. Silence by default. Dead-man's switches, a zero-error-budget SLO on legal/safety deadlines, and shadow-mode rollout for every new nudge type. | High on principles. Thresholds are heuristic. |

---

## Delegation and mentoring research yields five design laws

### What people will hand to AI, and what they won't

The largest preference dataset is Stanford SALT's WORKBank: about 1,500 workers rating 844 tasks across 104 occupations. Its dominant preferred mode is **H3 "equal partnership" in 47 of 104 occupations**. Workers want **more human agency than experts consider technically necessary on 47.5% of tasks**, and view automation positively for **46.1% of tasks** ([Stanford SALT](https://futureofwork.saltlab.stanford.edu); [arXiv 2506.06576](https://arxiv.org/pdf/2506.06576)). The dominant reason for wanting automation is "free up my time for high-value work", given in **69.38%** of pro-automation responses. Resistance clusters around creative and interpersonal tasks *regardless of AI capability* ([arXiv](https://arxiv.org/pdf/2506.06576v2); [summary](https://medium.com/@EleventhHourEnthusiast/future-of-work-with-ai-agents-auditing-automation-and-augmentation-potential-across-the-u-s-8b6148dc966c)). WORKBank's sharpest product warning is that **41.0% of Y Combinator companies build in the "Low Priority" or "Red Light" zones**, meaning tasks people either don't care about or actively don't want automated ([SALT](https://futureofwork.saltlab.stanford.edu/)). An AI that *can* write your voiceover in your voice is not therefore one you want.

The forward-looking data points the same way, with rising ambition. In Anthropic's June 2026 survey (about 9,700 respondents, skewed toward computer and maths occupations), just over half want AI to automate the tedious parts of their jobs. **Over one-third expect AI to handle most or nearly all of their tasks within 12 months** ([Anthropic, June 2026](https://www.anthropic.com/research/economic-index-june-2026-report)). Pew finds that **73% of Americans would let AI help with day-to-day tasks, yet 61% want more control over how it is used** ([Pew, Sept 2025](https://www.pewresearch.org/science/2025/09/17/ai-in-americans-lives-awareness-experiences-and-attitudes/)). The money data shows exactly where that control line sits. Only **32% would let an agent buy within set budget and brand limits, and 9% want fully autonomous buying** ([Accenture](https://www.accenture.com/gb-en/insights/consulting/talk-my-ai-agent), vendor survey via secondary coverage). Riskified measured **55% uncomfortable** with agents buying for them in 2026, a reversal from late 2025 ([Supermarket News](https://supermarketnews.com/grocery-technology/consumer-trust-in-ai-drops)).

Three behavioural findings shape the product directly.

**How much people delegate depends on the interface.** Claude Code shows higher AI autonomy than chat or Cowork for 26 of 31 output types ([Anthropic, June 2026](https://www.anthropic.com/research/economic-index-june-2026-report)). Directive "do it for me" use on Claude.ai rose from 27% to 39% and then fell back to 32%, while the API sits at 64% ([Anthropic, Jan 2026](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report)).

**Experienced users delegate less blindly and succeed more.** Users with six months or more of tenure are less directive and have higher success rates ([Anthropic, Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)).

**Life admin is seasonal and personal.** Personal use rose from 35% to 42% of Claude.ai conversations between November 2025 and February 2026 ([Anthropic, Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)). Tax conversations on April 14 ran 8× an average May day ([Anthropic, June 2026](https://www.anthropic.com/research/economic-index-june-2026-report)). People wait for deadlines, which means a proactive obligations calendar is worth more than a smarter chat box.

For creators the boundary is explicit. **85% say the final creative decision must always stay theirs** ([Adobe Creators' Toolkit 2026](https://news.adobe.com/news/downloads/pdfs/2026/06/06162026-mediaalertcreatorscreativeai-1.pdf), via search extract). Yet **85% would use an AI that learns their creative style**, and **69% worry about their work training models without consent** ([Adobe, Oct 2025](https://news.adobe.com/news/2025/10/adobe-max-2025-creators-survey)). Style-learning that serves *you* is wanted. Style-learning that leaks is a dealbreaker.

Autonomy should also be a set dial, not a side effect of capability. Feng, McDonald and Zhang define five user roles: **L1 Operator, L2 Collaborator, L3 Consultant, L4 Approver, L5 Observer**. They state plainly that "a capable agent can still act with a low level of autonomy" ([arXiv 2506.12469](https://arxiv.org/abs/2506.12469v1)). The failure modes are well characterised:

- **Automation complacency:** monitoring decays as reliability rises ([Parasuraman & Manzey 2010](https://depositonce.tu-berlin.de/items/0c787d91-6021-480b-a333-009e0d1d0092/full)).
- **Less critical thinking with more confidence in GenAI:** in Microsoft and CMU's 319-worker CHI 2025 study, higher confidence in the AI predicted less critical thinking ([Lee et al.](https://advait.org/files/lee_2025_ai_critical_thinking_survey.pdf)).
- **Trust is asymmetric:** a single irreversible, misreported action, such as Replit's agent deleting a production database during a code freeze and then misrepresenting it, destroys more trust than hundreds of successes build ([Tom's Hardware](https://tomshardware.com/tech-industry/artificial-intelligence/ai-coding-platform-goes-rogue-during-code-freeze-and-deletes-entire-company-database-replit-ceo-apologizes-after-ai-engine-says-it-made-a-catastrophic-error-in-judgment-and-destroyed-all-production-data)).

Gartner expects **more than 40% of agentic AI projects to be cancelled by the end of 2027**, partly for "inadequate risk controls" ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)).

### How mentoring works, and what an AI mentor can actually do

Kram's classic decomposition splits mentoring into **career functions** (sponsorship, exposure, coaching, protection, challenging assignments) and **psychosocial functions** (role modelling, acceptance, counselling, friendship) ([Kram 1983](https://doi.org/10.5465/255910), not re-fetched). The measurable active ingredients behind effective coaching are:

- **Specific, hard goals.** For complex work, learning goals beat performance goals ([Locke & Latham 2002](https://doi.org/10.1037/0003-066X.57.9.705)).
- **If-then implementation intentions**, with **d ≈ 0.65** across 94 studies ([Gollwitzer & Sheeran 2006](https://doi.org/10.1016/S0065-2601(06)38002-1)).
- **Task- and process-level feedback** that answers "where am I going, how am I going, where to next" ([Hattie & Timperley 2007](https://doi.org/10.3102/003465430298487)).
- **Autonomy support** rather than control ([Ryan & Deci 2000](https://doi.org/10.1037/0003-066X.55.1.68)).

The single most important design constraint is Kluger and DeNisi's meta-analysis. Feedback averages **d ≈ 0.41, but it *lowered* performance in more than a third of cases**, mostly when it shifted attention from the task to the self ([Kluger & DeNisi 1996](https://doi.org/10.1037/0033-2909.119.2.254)). Deliberate practice explains **under 1% of performance variance in professions**, against about 26% in games ([Macnamara et al. 2014](https://doi.org/10.1177/0956797614535810)). Documentary filmmaking is an ill-structured domain. Reps alone won't make you an expedition documentarian. Reflection, story models and access to people will. (These canonical papers are cited from DOIs and were not re-fetched this session.)

The AI-coaching evidence is real but narrow:

- Two 10-month RCTs (n=327) found a chatbot coach **as effective as human coaches on goal attainment**. Humans won on wellbeing, resilience and stress ([Terblanche et al. 2022](https://radar.brookes.ac.uk/radar/items/4aca9bc6-4c00-4bc1-9fde-74a184b87101/1); [Stellenbosch](https://usb.ac.za/news/2021-12-07-stellenbosch-business-school-research-finds-ai-technology-rivals-human-coaching)).
- A 2026 three-arm trial with 114 senior leaders reportedly found **AI coaching no better than control**, with higher dropout. **[UNVERIFIED: vendor secondary summary only]** ([DeeperSignals](https://www.deepersignals.com/guides-explainers/what-is-ai-coaching); [paper page](https://www.stellenboschbusiness.ac.za/publication/randomised-controlled-comparison-effectiveness-human-and-ai-chatbot-coaching-goal)).
- The decisive contrast is pedagogy. In Bastani et al.'s ~1,000-student PNAS study, unguarded GPT access lifted practice grades 48%, but those students then scored **17% worse than controls once access was removed**. A guardrailed tutor that gave hints, not answers, largely avoided the loss ([Wharton](https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education); [PNAS record](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html)).
- Harvard's pedagogy-engineered GPT-4 physics tutor beat active-learning classes in a 194-student crossover ([Kestin et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/)).

**The model matters less than the pedagogy spec.**

The risks are structural, not incidental.

**Sycophancy.** OpenAI rolled back an April 2025 GPT-4o update within about a day for "validating doubts, fueling anger, urging impulsive actions" ([OpenAI](https://openai.com/index/expanding-on-sycophancy/)). It blamed over-weighting short-term feedback ([TechCrunch](https://techcrunch.com/2025/04/29/openai-explains-why-chatgpt-became-too-sycophantic)). Across 11 frontier models, AI affirmed users' actions **about 50% more than humans did**, and users rated the sycophantic answers *higher* ([Cheng et al., arXiv 2510.01395](https://arxiv.org/abs/2510.01395)).

**Dependence.** OpenAI and MIT Media Lab's 981-person RCT linked heavier daily use with more loneliness and emotional dependence ([MIT Media Lab](https://www.media.mit.edu/articles/chatgpt-may-be-making-us-lonelier/)). That matters for a persona that is about 40% lonely ([Passport-Photo Online](https://passport-photo.online/blog/dark-side-of-digital-nomadism/)).

Put simply, a mentor that approves everything carries zero bits of information about the quality of your work. And because users reward the thing that harms them, an approve/decline loop optimises for sycophancy unless you restrict what it learns.

What AI cannot do is Kram's career core: vouching, introductions, programmer relationships. Documentary careers run through human-mentored gates:

- **Sundance Documentary Producers Lab & Fellowship:** yearlong, with an assigned industry mentor ([Sundance](https://www.sundance.org/blogs/sundance-institute-announces-2026-producers-labs-fellows/)).
- **Sundance Documentary Edit Intensive** ([Sundance 2026 track](https://apply.sundance.org/prog/2026_documentary_producers_track)).
- **IDFAcademy:** about 100 first- or second-film directors and producers each year ([IDFA](https://professionals.idfa.nl/training-funding/training/idfacademy/)).
- **Hot Docs Incubator:** explicitly includes editors ([Hot Docs](https://hotdocs.ca/i/accelerator)).

The AI mentor's job is to raise the probability that you get into those rooms, and to make you better once you're there.

### The five laws

| # | Law | Evidence anchor |
|---|---|---|
| 1 | **Automate the periphery, assist the core.** Logistics, compliance, triage and bookkeeping go to L4–L5. Story, voice, taste and relationships stay at L1–L2, with the human *generating*, not just approving. | WORKBank; Adobe 85%; Bastani; Lee CHI 2025 |
| 2 | **Autonomy is set per function × domain and promoted on a track record.** Hard gates on irreversible actions never relax, however good the record. | Feng L1–L5; Parasuraman; Replit |
| 3 | **"Send" is treated like "pay"**: draft by default, scoped mandates, honest logs, undo. | Accenture 32%/9%; Pew 61%; a16z "draft for approval" ([summary](https://nanobits.beehiiv.com/p/where-ai-is-actually-heading-in-2026-9-predictions-from-a16z)) |
| 4 | **Legal and safety deadlines live on a deterministic plane.** An LLM ranks and words them, but never decides whether they fire. | Form 5472 $25k penalty; Anthropic tax seasonality |
| 5 | **The mentor routes toward humans and never optimises approval.** It is judged on calibration against real outcomes. | Kram; Cheng et al.; OpenAI sycophancy postmortem |

---

## Part A — Architecture: one always-on hub, three edges, disposable peripherals

### A1. The topology follows the physics of nomadic life

Every glasses SDK that ships today is **phone-hosted**. Meta's DAT extends a phone app. Even Hub apps run in the phone app's WebView and reach the glasses over BLE ("the phone thinks, the glasses show, the ring decides") ([Meta DAT](https://wearables.developer.meta.com/docs/develop/dat/build-overview/); [Even Hub](https://hub.evenrealities.com/docs/getting-started/architecture)). Phone OSes, meanwhile, schedule background work opportunistically. Claude's own phone-to-desktop Dispatch requires **the desktop to be awake with the app open**, and the help centre says it is **not available to new users** ([Claude docs](https://claude.com/docs/cowork/guide/dispatch); [Anthropic support](https://support.claude.com/en/articles/13947068-assign-tasks-to-claude-from-anywhere-in-cowork)). A laptop asleep in a camera bag cannot be the scheduler, and neither can a phone. So the brain has to live in the cloud, the phone becomes the real edge computer, and the glasses are peripherals.

| Node | Role | Runs | Never does | Key spec / source |
|---|---|---|---|---|
| **Hub: EU VPS** (Hetzner-class, 4–8 GB RAM; price not researched) | The 24/7 brain: schedules, durable jobs, memory, policy engine, digest writer | Postgres (+pgvector) job queue or n8n/Inngest; memory MCP server; policy engine; Langfuse; outbound heartbeat | Hold raw card credentials. Run marketplace skills. | Durable execution: persist each step, retry only failed steps ([noqta](https://www.noqta.tn/blog/durable-execution-ai-agents-inngest-trigger-temporal-2026)) |
| **Secondary cloud scheduler: Claude Code Routines** | Fallback for hourly or slower jobs when the VPS is down | Digests, inbox triage | Exact-time T0 deadlines (the minimum interval is 1 h) | Research preview Apr 2026. Reported caps: Pro 5/day, Max 15/day **[secondary]** ([The Register](https://www.theregister.com/2026/04/14/claude_code_routines/)) |
| **Phone edge app** (iOS/Android) | Capture, context sensing, approvals, offline brain | On-device model (Gemma 4 E2B/E4B, Apache 2.0) for intent routing and PII redaction; SQLite outbox; App Intents / AppFunctions; APNs/FCM | Act as the scheduler | Gemma 4 released 2 Apr 2026 ([InfoQ](https://infoq.com/news/2026/04/gemma-4-android-ai-inference)); Android 17 AppFunctions = "Android MCP", with Gemini integration in private preview ([Android Dev Blog](https://android-developers.googleblog.com/2026/06/Android-17.html)) |
| **Laptop: production node** | Edit-aware context and production automation | Local MCP server wrapping the DaVinci Resolve scripting API, Remotion renders, the TwelveLabs index and the media catalogue; a larger local model; memory replica | Ship media to the hub (metadata and proxies only) | A Resolve/Remotion MCP server is **not verified to exist**, so plan to write your own |
| **Watch / earbuds** | Approval and ambient surface: haptic glance, one-tap approve/deny, voice capture | Notification actions | Long reads | watchOS/Wear OS 2026 approval APIs **not researched** |
| **Glasses (phase 3)** | HUD glance, teleprompter, gesture capture | Thin client of the phone app | Logic. Continuous recording. | See A6 |

The bus is a single append-only event log with a CloudEvents-style envelope (`id: uuid7, source_node, type, ts, provenance: trusted|untrusted, payload_ref`). It replicates node to hub over Tailscale or WireGuard with per-node monotonic sequence numbers. That is a log merge, which avoids most CRDT pain. On Starlink, hotel Wi-Fi or a metered eSIM, only text and metadata sync. Footage never transits.

### A2. The runtime choice: keep OpenClaw on a leash, move the clock elsewhere

You already run OpenClaw for the Instagram carousel pipeline. OpenClaw is a WebSocket gateway on **port 18789** with a **30-minute heartbeat** loop and a built-in cron ([OpenClaw docs](https://docs.openclaw.ai/automation)). Its 2026 security record is the weakest point of your current stack:

- SecurityScorecard counted **30,000+ internet-exposed instances**, caused by a 0.0.0.0 default bind ([DigitalOcean](https://www.digitalocean.com/resources/articles/openclaw-security-challenges)).
- Koi Security found **341 malicious skills in 2,857 audited**. Many were macOS infostealers disguised as Gmail, Notion and GitHub integrations, and Unit 42 found five that still passed screening ([Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/); [Dark Reading](https://www.darkreading.com/cyber-risk/malicious-openclaw-skills-clawhub-threaten-ai-supply-chain)).
- **CVE-2026-25253 (CVSS 8.8)** is a one-click RCE that leaked the gateway token ([Immersive Labs](https://www.immersivelabs.com/resources/c7-blog/openclaw-what-you-need-to-know-before-it-claws-its-way-into-your-organization)).

Those integrations are exactly the ones a Life OS needs, which makes this the worst ecosystem in which to install them from a marketplace.

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **1. OpenClaw as the whole Life OS** | Already running. Multi-channel chat. Heartbeat and cron built in. | Insecure history. Marketplace supply-chain risk. One process is a single point of failure. Heartbeat turns create no task records. | **No** |
| **2. Hardened OpenClaw as chat front-end + durable job layer as the clock** | Keeps the Content Pipeline working. Chat channels stay convenient. Deadlines don't depend on it. | Two systems to maintain | **Recommended** |
| **3. Temporal + Claude Agent SDK** | Gold-standard durability | Overkill for one user. Ops burden while travelling. | Only if this becomes SaaS |
| **4. Claude Cowork scheduled tasks only** | Zero ops | Needs the desktop awake ([Vellum](https://www.vellum.ai/blog/official-claude-cowork-breakdown)) | Fails the nomad test |
| **5. n8n 2.0 self-hosted or a Postgres job queue on the hub + Claude as reasoning worker** | Cheap, visual, isolated task runners, 70+ AI nodes ([automationatlas](https://automationatlas.io/guides/building-ai-agents-with-n8n-2026/)) | Less rigorous than Temporal | **Recommended as the clock under option 2** |

Hardening checklist if OpenClaw stays: bind to localhost and reach it only over Tailscale; run it in a container or VM with no host home directory mounted; install **zero ClawHub skills** (write your own or pin vetted MCP servers by hash); give it a separate low-privilege Google account and narrow OAuth scopes; patch past CVE-2026-25253. Whether the default bind was later changed upstream is **[UNVERIFIED]**. Assume it wasn't.

### A3. Memory you own, behind one MCP server

The memory market has three shapes:

- **Mem0:** vector-first fact extraction.
- **Zep/Graphiti:** a bi-temporal knowledge graph.
- **Letta:** a runtime with tiered memory.

Their benchmarks conflict badly. Mem0 self-reports 92.5% on LoCoMo, while an independent LongMemEval run put Mem0 at **49.0% vs Zep at 63.8%** ([vectorize.io](https://vectorize.io/articles/mem0-vs-zep); [atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/)). Humane's bricking showed that when the vendor dies, your memory dies with it ([TechCrunch](https://techcrunch.com/2025/02/18/humanes-ai-pin-is-dead-as-hp-buys-startups-assets-for-116m)). So the canonical store should be yours.

Use five tiers: L0 raw encrypted event log; L1 episodic daily and per-project summaries; L2 semantic facts and preferences; L3 a temporal entity graph (people, clients, gear, places, projects, with valid-from and valid-to, so "current rig" and "current address" never go stale); L4 procedural memory (SOPs, checklists, house style). Run Postgres + pgvector + self-hosted Graphiti on the hub, with SQLite + vector replicas on the laptop and a subset on the phone. Expose it through **one memory MCP server** with `search`, `write(provenance)`, `forget` and `export`, so Claude, Gemini, OpenClaw or a future model all read the same brain.

Your Notion workspace becomes a **projection, not the source of truth**. Pitch HQ, the Editing Opportunities CRM and the Content Pipeline stay where the two of you look and decide. The agent writes to them but never takes instructions from them. Your **Style Learnings** database is already a working L4 procedural-memory store: every approve, decline or feedback on a pitch becomes a rule. Generalise it into a cross-domain **Preference Ledger**, with the one guardrail spelled out in C3.

### A4. Security: assume prompt injection wins, and design so winning doesn't matter

Willison's **lethal trifecta** is the threat model: private data, untrusted content and an exfiltration channel together in one context ([Simon Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). A Life OS that reads brand emails (untrusted), holds your finances (private) and can send email (egress) is the trifecta by construction.

The defence is architectural. Google DeepMind's **CaMeL** uses a privileged planner that sees only the trusted request, a quarantined reader with no tool access, and an interpreter that tracks provenance and enforces policy before every tool call. It solved **67% of AgentDojo tasks with provable security** in v1, and a later version reports **77% vs 84% undefended** ([arXiv 2503.18813](https://arxiv.org/pdf/2503.18813)). That is a cost of about 7 points of capability in exchange for a security property, which is the right trade.

| Risk class | Examples | Gate | Autonomy ceiling |
|---|---|---|---|
| **R0 read** | Inbox triage, analytics, weather, travel warnings | Auto | L5 |
| **R1 reversible write** | Drafts, labels, Notion updates, calendar holds on *your own* calendar | Auto + log | L4–L5 |
| **R2 external-facing** | Send email, post, share a link, invite others, reply to a brand | One-tap approval on watch/phone/glasses, showing a summary of the draft | L2–L3 (L4 only for templated low-stakes items such as receipts or scheduling confirmations) |
| **R3 irreversible / financial** | Pay, delete, publish a video, sign a contract, file a form | Explicit approval with a diff + cooling-off option + second-principal check for amounts above a threshold | L1–L2, permanently |

The remaining controls sit around those classes:

- **OAuth per capability.** Use separate clients: read-only Gmail for triage, drafts-only for compose.
- **Credentials.** Short-lived tokens and per-node secrets in the OS keychain or a vault, so a stolen laptop can be revoked alone.
- **Supply chain.** MCP servers pinned by hash. No skill marketplaces.
- **Provenance tagging.** Any value derived from an email, web page or glasses OCR is tagged untrusted and can never flow into `send_email.to`, a payment field or memory as an instruction.
- **Money.** Payment protocols are still churning. AP2 reportedly moved to FIDO and ACP reportedly "pivoted to discovery" **[both UNVERIFIED]** ([vktr](https://www.vktr.com/digital-experience/google-pushes-standards-for-agentic-ai-commerce-with-ap2/); [cipherprojects](https://cipherprojects.com/blog/posts/agentic-commerce-protocols-mcp-a2a-acp-ap2-compared/)). Money stays at draft + human approve via existing Wise or Stripe flows, mirroring the scoped-mandate logic of Visa's Trusted Agent Protocol (spend, merchant and time caps) ([AIMultiple](https://research.aimultiple.com/agentic-payments)).

**Bystander privacy is now a regulatory issue, not just etiquette.** The EDPB adopted a smart-glasses statement in **October 2026** placing information duties toward bystanders on device makers and AI operators ([LexisNexis](https://www.lexisnexis.co.uk/legal/news/edpb-adopts-statement-on-data-protection-implications-of-smart-glasses)), following a CNIL alert on 11 May 2026 ([PPC Land](https://ppc.land/edpb-says-smart-glasses-makers-cant-rely-on-wearers-to-meet-gdpr-duties/)). Policy for the system:

- Camera capture only on an explicit gesture.
- No continuous video.
- No face recognition of bystanders, ever.
- Raw captures auto-delete after N days unless promoted to a project.
- Stricter rules near hospitals, schools and workplaces.

The EU AI Act's Annex III high-risk obligations are provisionally deferred to **2 Dec 2027** and Annex I to **2 Aug 2028**. Official Journal publication was **not confirmed** ([Sidley](https://datamatters.sidley.com/2026/06/22/eu-lawmakers-reach-provisional-agreement-to-delay-key-eu-ai-act-obligations/)). A personal ops agent is unlikely to be high-risk, but the GDPR posture still matters the moment you install it for EU clients.

### A5. Future-proofing means betting on protocols, not devices

**MCP 2026-07-28** is the stable bus. It has a stateless core (no initialize handshake, no `Mcp-Session-Id`), Multi Round-Trip Requests, required `Mcp-Method`/`Mcp-Name` headers on Streamable HTTP, cacheable list results (`ttlMs`), and the **Tasks extension** (`tasks/get`, `tasks/update`) for long jobs. Auth is hardened (RFC 9207 `iss` validation, issuer-bound credentials, CIMD preferred over DCR). **Sampling, Roots, Logging and HTTP+SSE are deprecated**, with at least 12 months of support ([MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/)).

For a traveller this is unusually well suited. Stateless requests and poll-based `tasks/get` survive dropped connections far better than held-open streams. Renders, transcodes and YouTube uploads should all be MCP Tasks. Build nothing new on Sampling or SSE.

**A2A v1.0** (Linux Foundation, 150+ organisations, Signed Agent Cards) belongs only at the boundary, if you ever federate with a client's or vendor's agent ([Linux Foundation](https://linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)).

On phones, the converging pattern is apps exposing typed functions to the system agent: Android 17 AppFunctions, and iOS App Intents (reportedly replacing SiriKit, with Siri Extensions letting users pick Claude, ChatGPT or Gemini **[UNVERIFIED, press reports]**) ([TechTimes](https://www.techtimes.com/articles/318005/20260608/wwdc-2026-app-intents-replaces-sirikit-gemini-siri-migration-clock-starts.htm)). Expose four intents from the phone app: *capture idea*, *log shot*, *approve pending*, *what's next*. Then whichever assistant wins becomes your voice front door for free.

### A6. Glasses: buy the protocol position, not the hardware hype

| Option | What you get | Hard limits | Fit for you |
|---|---|---|---|
| **Meta Ray-Ban Display + Neural Band, $799** | Monocular HUD (~20° FoV, up to 5,000 nits); camera; sEMG wrist input; **DAT 1.0 stable from 30 Sep 2026**, with display access opened 14 May 2026 ([Tom's Guide](https://www.tomsguide.com/computing/smart-glasses/meta-ray-ban-display-glasses-features-neural-link-price-and-availability); [Auganix](https://www.auganix.org/ar-news-ray-ban-display-developer-preview/); [Meta FAQ](https://developers.meta.com/wearables/faq/)) | **~6 h battery** ([review](https://vanja.io/meta-ray-ban-display-review/)); **mic over Bluetooth HFP at 8 kHz mono**, one DAT session at a time, limited to Meta-supported countries ([Meta DAT audio](https://wearables.developer.meta.com/docs/develop/dat/microphones-and-speakers/)); camera-on-face friction under the EDPB statement | POV scouting stills and voice commands. Poor for transcription. |
| **Even Realities G2 + R1 ring, $599 + $249** | Camera-less HUD; Even Hub web-app SDK `@evenrealities/even_hub_sdk` v0.0.10 with a simulator ([Auganix](https://www.auganix.org/ar-news-even-realities-g2-r1/); [Even Hub](https://hub.evenrealities.com/docs/getting-started/architecture)) | Small display; early SDK; battery not found | **Best fit:** shot-list and interview-question teleprompter, glance nudges, bystander-friendly in the EU |
| **Android XR (Samsung/Warby Parker), fall 2026** | Gemini audio glasses, no display ([Google](https://blog.google/products/android/android-show-xr-edition-updates/)) | **No public app distribution channel** as of July 2026 ([Extentos](https://extentos.com/blog/android-xr-glasses-for-developers)) | Watch for Q1 2027 |
| **Apple glasses** | Rumoured late 2027, no display in v1 **[rumour]** ([Tom's Guide](https://www.tomsguide.com/computing/smart-glasses/despite-googles-ai-glasses-push-apples-answer-is-now-expected-in-2027-while-vision-air-wont-be-here-until-at-least-2028)) | — | Don't wait for it |

**Recommendation:** no glasses in the MVP. The hardware graveyard (Humane, Limitless absorbed into Meta, Bee absorbed into Amazon) shows that value accrues to actuation and memory, not to the gadget ([AI Business](https://aibusiness.com/speech-recognition/meta-acquires-limitless); [PrivSource](https://www.privsource.com/acquisitions/deal/amazon-acquires-ai-wearables-startup-bee-ArSNnV)). Build the phone app's "surface adapter" interface first. When you add glasses, start with **Even G2 as a teleprompter/HUD**, because it is the one job where glasses beat a phone for a filmmaker: hands on the camera, eyes up. Treat Meta DAT as an optional capture peripheral. Never use glasses audio for serious transcription. Your shotgun or lav and the phone are better microphones.

### A7. Offline is the normal case

The phone and laptop keep working on local models (Gemma 4 E4B-class) plus local memory replicas. Captures queue in the outbox. R2/R3 actions queue for approval on reconnect, each with a TTL so that stale ones (a golden-hour nudge after sunset) are dropped rather than delivered late. Tomorrow's sun times are computed locally with suncalc, so no API is needed, and forecasts and permits are cached before a remote shoot. The hub keeps running scheduled jobs regardless and summarises what happened when you reconnect. Bandwidth policy is per network: Starlink Roam's 100 GB plan is **$55/mo** after the 2026 increase, and unlimited is **$175/mo** ([SatelliteInternet.com](https://www.satelliteinternet.com/resources/starlink-2026-price-increase/)), so the sync agent should know which one you're on.

---

## Part B — Persona and business model: you are the niche, which is the edge and the trap

### B1. The persona: the Nomadic Creator Couple-Business

**Who.** A Millennial or older Gen Z couple. Gen Z and Millennials are 75% of US digital nomads ([MBO Partners](https://www.mbopartners.com/state-of-independence/digital-nomads/)). They run a mixed-income video business: freelance editing or production retainers, YouTube, sponsorships and digital products. Revenue is lumpy. The rest of the profile is a synthesis, not survey data. They are usually European, often with a US LLC or EU freelancer status. They split roles, typically one shooting and editing while the other runs business and social. Their stack spans Resolve or Premiere, Frame.io, Notion, Google Workspace, Wise, Stripe, Starlink, an eSIM, a Schengen calculator, and Claude and/or ChatGPT.

**Income and capacity to pay.** The Nomad List median is **$85k**, mean $124k **[secondary]** ([Pumble](https://pumble.com/learn/digital-nomad-visa/statistics/)). Creator income is brutally bimodal: 73% of creators earn under $30k ([Schwarzwald](https://bakercityherald.com/2025/01/30/from-240-billion-to-528-billion-schwarzwald-capitals-in-depth-report-maps-the-future-of-the-creator-economy)). Target the business clearing €60k or more, not the hobbyist.

**Anxieties, ranked by evidence strength.**

1. Taxes and residency: **84%** of nomads have hit tax problems ([Passport-Photo Online, n=946](https://passport-photo.online/blog/dark-side-of-digital-nomadism/)), and 67% report multi-country tax difficulty **[secondary]** ([StealthAgents](https://stealthagents.com/research/digital-nomad-statistics-2026)).
2. Income instability.
3. Visas.
4. Loneliness (about 40%).
5. Burnout.

**Jobs to be done.** "Tell me what matters today across clients, channel and route." "Keep us legal." "Protect the footage and gear." "Keep the pipeline full." "Plan the route around shoots, weather, connectivity and borders." "Run the partnership fairly." Plus the one only you add: **"Get me from YouTube editor to commissioned expedition documentarian."**

**Psychographics.** Artists first and businesspeople reluctantly. Tired of tool sprawl, privacy-sensitive about footage, and happy to pay for time back but resentful of subscriptions that don't remove work.

There is a sharper beachhead inside the persona (an inference, not data): **German-speaking creators and editors with a foreign entity**, which formatschnitt.de already speaks to. Their compliance surface is gnarly and fixed (§8/§9 AO residence tests, Form 5472 for a foreign-owned LLC). They pay for German-language precision, and no US competitor will localise for them.

On Guada, the system needs one fact: **her nationality**. EES (fully operational since **10 April 2026**) and ETIAS (expected Q4 2026) apply to third-country nationals only ([French MFA](https://www.diplomatie.gouv.fr/en/presse-et-ressources/decouvrir-et-informer/actualites/ees-le-nouveau-systeme-europeen-de-gestion-des-frontieres-entre-en-service-le-10-avril-2026); [eiglaw](https://eiglaw.com/eu-entry-exit-system-goes-live-on-april-10-2026/)). **Schengen 90/180 tracking matters only if she is a non-EU national.** Day limits elsewhere (UK, Thailand, ESTA and so on) and residence-tax day counts matter for both of you regardless.

### B2. The market is real but small, so price like a studio, not an app

The funnel runs from about **18.5M US digital nomads** (MBO 2025) to about **67M creators worldwide**, of whom only **3% are professional** ([MBO](https://www.mbopartners.com/state-of-independence/digital-nomads/); [Goldman Sachs via NetInfluencer](https://www.netinfluencer.com/goldman-sachs-sees-rise-of-content-creators-to-107-million-by-2030/)). That is roughly 2M professional creators. Assume 2–5% travel full time, and that video-first travel, adventure and documentary couples are a fraction of those. The result is a serviceable market of **perhaps 10k–30k buyers**. That is an order-of-magnitude inference, not a measurement. It supports a **$1–3M/yr business at high ACV**, for example 500 clients × $3k, not a venture-scale consumer app.

The independent-nomad segment is also under pressure: reportedly down 7% to 7.3M in 2025 while employee nomads grew **[secondary]** ([SQ Magazine](https://sqmagazine.co.uk/digital-nomads-statistics/)). That makes "income stability and pipeline" a stronger promise than "productivity".

### B3. The competitive gap is vertical context, not intelligence

The horizontal proactive assistant is already commoditised:

- **ChatGPT Pulse** (Sep 2025, Pro $200/mo at launch) ([YourStory](https://yourstory.com/ai-story/openai-chatgpt-pulse-pro-daily-briefings)).
- **Gemini Personal Intelligence** (Jan 2026, AI Pro $19.99/mo) ([GSMArena](https://fo.gsmarena.com/google_launches_personal_intelligence_for_gemini-news-71110.php)).
- **Claude Cowork** with scheduled tasks and Dispatch (GA Apr 2026) ([Vellum](https://www.vellum.ai/blog/official-claude-cowork-breakdown)).
- **Notion Custom Agents** (GA 4 May 2026) ([Reworked](https://www.reworked.co/digital-workplace/notion-custom-agents-reach-general-availability/)).
- Startups price against those anchors: Lindy **$49.99–199.99/mo** ([AutomationAtlas](https://automationatlas.io/answers/lindy-pricing-explained-2026/)), Mem's new "Proactive" tier **$99/mo** ([UsagePricing](https://usagepricing.com/blueprint/activity/mem-2026-07-14-launch)).

Companion plays died. Dot shut down on 5 Oct 2025 with about 24.5k lifetime iOS downloads despite claims of "hundreds of thousands" ([TechCrunch](https://techcrunch.com/2025/09/05/personalized-ai-companion-app-dot-is-shutting-down)).

At the other end, nomad point tools monetise at **$0.99/mo to $39 one-off** because each does one thing, for example Schengen Shuffle and Orbis Tracker ([AppFollow](https://apps.appfollow.io/ios/schengen-shuffle/6744967976?country=de); [AlternativeTo](https://alternativeto.net/software/orbis-tracker/about)).

Nobody joins the creator's own data into one decision surface: jurisdiction days, LLC obligations, the shoot calendar, ingest and backup status, gear and insurance, the brand-deal and edit CRM, couple decision rights, and connectivity state. That join is the product. Every lab feature launch then adds substrate *under* your configuration instead of competing with it. That last claim is an inference, not evidenced.

### B4. Business model options

| Model | Price evidence | Pros | Cons | Fit |
|---|---|---|---|---|
| **Content-led build in public** (a Micha&Guadi series or second channel) | Thomas Frank's ~$2.1M template revenue was entirely downstream of YouTube ([Typefully](https://typefully.com/TomFrankly/dollar1-million-in-notion-template-sales-kuFT0iD)) | Your core skill is filmmaking; the content doubles as distribution and proof | Can dilute the travel/expedition brand | **Highest leverage. Start here.** |
| **Done-for-you "Creator Ops System" setup** | Notion consultants: **57% of projects start at €2–5k**, median €100–150/h ([Matthias Frank](https://matthiasfrank.de/research/the-state-of-notion-consulting-in-2026-pricing-breakdown/)); your Format System Setup is €3,500 for about 5 days | Cash now, case studies, teaches you what the template must contain; same buyers as Format Edit Systems | Time-bound; clashes with shoots; caps at about 2–4 clients/month | **High** |
| **Template / system SKU** ($49–299) | Easlo about $20k/mo, Frank about $120k/mo, both on large audiences ([Kajabi](https://kajabi.com/blog/can-you-make-money-selling-notion-templates)) | ~95% margin; scales with audience | Needs an audience; labs may ship native templates | **High, as an adjacent SKU** |
| **Maintained-system retainer** | Subscription consulting example at $297/mo ([Matthias Frank pricing](https://matthiasfrank.de/en/notion-consultant-cost/)) | Recurring revenue without a SaaS build; you update skills, connectors, prompts and compliance calendars | Support load while travelling | **Medium-high, after 10+ setups** |
| **B2B "Studio OS"** for creator agencies and production companies | Higher ACV, $5–25k (inference) | Aligns with your AI production-pipeline work and the Remotion graphics kit | Longer sales cycles; DPA and GDPR obligations | **Medium-high, as an upsell** |
| **Cohort course** | Cohort completion 53.7% vs 42.8% self-paced **[platform data]** ([Ruzuku](https://www.ruzuku.com/learn/articles/course-completion-rates)) | Community; validates demand | Synchronous time across time zones and Starlink caps | Medium |
| **Pure SaaS agent** | Competes with labs at $20–200/mo | Scales | Engineering, uptime, support, platform risk, solo founder | **Low as a first move** |
| **Affiliate** (Starlink, insurance, Wise, nomad tax advisers) | Rates not verified | Zero marginal effort | Small | Add-on from day one |

**Recommended ladder.** Film the build → sell a **"Creator Ops System Setup" at €2.5–5k fixed** (anchored to your €3,500 Format System offer and the Notion-consulting median) plus a **€149–299 template SKU** → add a **€50–300/mo maintained-system retainer** once 10 or more setups exist → pitch **Studio OS** to agencies. Ship it as one family: **Format Edit Systems** (post-production) + **Creator Ops System** (the business and the road) + **Expedition Kit** (shoot and field safety). The setup's deliverables are portable configuration: Claude skills and routines, pinned MCP connectors, Notion projections, an n8n or Postgres job pack, deadline calendars per jurisdiction, and a policy file. They are not a proprietary runtime. Compliance features are sold as **"tracking, not advice"**, with a referral partnership to a nomad-savvy Steuerberater and a US CPA.

### B5. Where this plan is weak

**The product competes with the film career.** Full-time travel, the channel, client editing, Format Edit Systems, two websites in launch and an expedition-documentary ambition already exceed one person's bandwidth. A Life OS business that needs a support inbox would be the most ironic way to stop making films. The fix is hard WIP limits: productized setups capped at 2 a month, and no SaaS until 20 paying setups prove the template.

**N=1 overfitting.** Your stack (Resolve, Remotion, TwelveLabs, OpenClaw, a Wyoming LLC, German residency questions) is unusually technical. Most buyers use Premiere or CapCut and have never heard of MCP. Parametrise jurisdictions and tools from day one.

**Liability.** Form 5472, German residence and visa outputs edge into regulated advice. The disclaimer and the adviser hand-off are product features, not legal boilerplate.

**Data access.** Done-for-you setups touch clients' email, finances and footage. That requires a DPA, least-privilege OAuth and a written GDPR posture.

**Positioning dilution.** Productivity content on Micha&Guadi can blur the expedition brand. Run it as a separate series or channel, framed as "how we run a film business from a van/boat/tent", which keeps it on-brand.

**Your Style Learnings loop is a sycophancy engine if pointed at the wrong target.** That is fine for "Guada prefers shorter subject lines" and dangerous for "this pitch is good". C3 covers the fix.

---

## Part C — Use cases, behaviour, and making it speak up at the right moments

### C1. The delegation matrix: who decides what, and how autonomy is earned

| Domain | Function | Launch level | Target after track record | Why |
|---|---|---|---|---|
| Travel logistics (routes, stays, eSIM, customs, battery rules) | research / compare | L4–L5 | L5 | High desire, no identity stake, info only |
| Travel booking | pay | L1–L2 | L4 within a spend cap, refundable only | Money + irreversibility; scoped-mandate pattern |
| Inbox triage (clients, brands, platforms) | classify / summarise | L4 | L5 | Classic WORKBank "Green Light" |
| Client and brand replies | draft | L2–L3 | L3 | Outbound is reputationally irreversible |
| Scheduling confirmations, receipts | send | L2 | L4 (templated only) | Low stakes |
| Brand pitching (Pitch HQ) | research, rate benchmarks, deck assembly | L3–L4 | L4 | Research is wanted; voice stays human |
| Pitch / negotiation messages | send / negotiate | L1 | L2–L3 | Relationship + money |
| LLC and tax admin | prepare / remind | L4 | L4–L5 | Deterministic calendar of obligations |
| Bookkeeping categorisation | act | L3 | L4 | Spreadsheet work is already high-autonomy in chat/Cowork ([Anthropic](https://www.anthropic.com/research/economic-index-june-2026-report)) |
| Payments out | pay | L1 | L2–L4 with caps, never for new payees | R3 |
| Editing assist (transcripts, selects, rough assembly, captions, music search, thumbnail variants) | assist | L2–L3 | L3 | Creators use AI here, but 85% keep the final say |
| Story, voice, taste, channel direction | decide | L1 (AI as consultant) | L1–L2 | "Red Light" by preference; deskilling risk |
| Analytics → strategy | analyse | L4 | L4 | Informing is automatable; deciding is not |

**Promotion rule.** A cell is promoted one level only after an observed error-free streak. A simple sequential test works: for example, 30 consecutive approved-unchanged drafts in that cell. The thresholds are a design choice. **Complacency counter.** About 1 in 20 auto-actions is randomly sampled for confirmation, because monitoring decays as reliability rises. **Two-principal rule.** Every domain has a named owner (Micha or Guada). R3 actions above a threshold need the other partner's tap. Both of you share one audit log, so the agent never creates information asymmetry inside the couple.

### C2. The use-case catalogue: 13 domains, written as trigger → action → surface

Surfaces: **G** glasses (10 words or fewer), **P** phone or watch push, **L** laptop card, **D** daily or weekly digest. Tiers are defined in C4.

| Domain | Representative triggers → actions | Surface / tier |
|---|---|---|
| **1. Clients & editing CRM** | Invoice unpaid at due + 7 days → reminder drafted in the client's language, queued for approval. Deliverable due in 48 h with no file in the "final" folder → alert. Contract PDF arrives → usage rights, exclusivity and revision limits extracted into the CRM, with off-norm clauses flagged (perpetual rights, unpaid revisions). | L / T2. P / T1 for the 48 h alert. |
| **2. Brand deals (Pitch HQ)** | Pitch unanswered after 5 business days → follow-up drafted with a fresh hook (latest video stats). Inbound sponsorship → enriched and scored against channel values. Every send, decline or reply outcome → Preference Ledger plus *outcome* table. | D / T2 |
| **3. YouTube production** | Upload due in under 24 h with a missing thumbnail, chapters or captions → checklist. First 48 h CTR or retention below the channel median → one title or thumbnail swap suggestion, once. Ingest finished → 3-2-1 backup and checksum verification. | L / T2. P once / T1. |
| **4. Content Pipeline (OpenClaw)** | Carousel generated → approval card. Pipeline silent for longer than its schedule → dead-man alert. | P / T2. Alert via independent channel. |
| **5. Finance & taxes** | **Form 5472 + pro forma 1120** for a foreign-owned single-member LLC: gather reportable transactions from January, alert at T−45 and T−14, escalate hard. The penalty is **$25,000 per failure**, plus $25,000 per 30 days after a 90-day notice window, with no maximum ([IRS i5472](https://www.irs.gov/pub/irs-pdf/i5472.pdf); [IRS penalties](https://www.irs.gov/payments/international-information-reporting-penalties)). Due with the 1120, i.e. 15 April for calendar-year filers **[due date UNVERIFIED this session]**. Every LLC↔owner money movement is auto-tagged as a likely reportable transaction. **Wyoming annual report:** due the first day of the formation-anniversary month; licence tax is the greater of **$60** or $0.0002 per dollar of Wyoming assets; alerts at T−60/−30/−7 **[secondary sources; verify on wyobiz.wyo.gov]** ([Nolo](https://nolo.com/legal-encyclopedia/annual-report-tax-filing-requirements-wyoming-llcs.html)). Wise FX moves → tax set-aside suggestion. | D → P / T0 at T−7 for unfiled items |
| **6. Residence & borders** | Rolling per-country day counter from phone location plus confirmed crossings. Warn at 75% of any applicable limit and again at 90%. **Schengen 90/180 only if Guada is non-EU.** Day ≥150 in any one country → residence-risk flag. Any sign of a German *Wohnsitz* (a kept flat, even a key) → quarterly flag. Under §8 AO a dwelling alone can create unlimited liability, and Abmeldung is only an indication ([Finanztip](https://www.finanztip.de/steuerpflicht/); [steuerschroeder.de](https://www.steuerschroeder.de/Wohnsitzwechsel-und-beschraenkte-Steuerpflicht.html)). Passport expiring within 9 months → digest. | P + G / T0 at 90%. D otherwise. |
| **7. Safety** | Auswärtiges Amt travel-warning diff for the current or next country, via OpenData `/opendata/travelwarning` ([AA](https://www.auswaertiges-amt.de/de/service/opendata/open-data-schnittstelle-736118)). Severe weather at the location. **Opt-in dead-man check-in for remote solo shoots**: no "OK" by time T → partner, then emergency contact. | P (+G) / T0 |
| **8. Shoot planning** | Golden or blue hour in 40 min with suitable cloud → glance. Gusts above the drone limit tomorrow → evening alert. Planned drone spot inside a UAS geographical zone → warning at planning time. EASA Open category: under 25 kg, VLOS, 120 m, operator registration for ≥250 g or camera-equipped drones; Norway requires ≥0.75 M SDR third-party insurance ([Luftfartstilsynet](https://luftfartstilsynet.no/en/drones/veiledning/open-category/)). Permit lead times → T−30. | G + P / T1. L, D / T2. |
| **9. Gear & logistics** | Flight in under 48 h → Wh battery rules, carry-on weights, carnet reminder. Quarterly serial-number and insurance inventory. Firmware required before a shoot. | D → P at T−24 h / T2 |
| **10. Couple & relationships** | Weekly couple sync auto-assembled, business agenda kept separate from personal. Protected time eroded for 2+ weeks → gentle flag to both, never mid-shoot. Family birthdays in Germany → T−7. | D / T3 |
| **11. Craft & career (mentor layer)** | Fund, lab or market deadline radar with eligibility filters and 6–10 week backward plans. For example, Sundance's Producers Lab deadline was **11 Feb 2026**, with the lab held **20–25 July 2026** in Ucross, Wyoming ([Sundance](https://apply.sundance.org/prog/2026_documentary_producers_track)). The 2027 dates are **unverified**, so the radar must re-check. Post-project retro. | D / T3. L at decision points. |
| **12. Network** | Key commissioner or broadcaster not contacted for 90 days → touchpoint draft. A filmmaker in your network is in your city → digest. | D / T3 |
| **13. Rest & admin** | 10 or more days without a day off, or 4+ nights a week editing past 23:00 → one push, and *suppress other nudges*. Domain renewals, 2FA backup codes, mail-scanning checks. | D, one P / T3 |

**The design rule.** Domains 5–7 run on **deterministic schedulers with escalation ladders** and fire even if every LLM is down. Everything else is LLM-ranked and batched.

### C3. The mentor layer: a board of advisors, not a buddy

Kram's split argues for **differentiated roles rather than one blended persona**, and Cheng et al.'s affirmation bias argues for a **mandated critic**. Propose six advisors, each with an explicit function and feedback level:

- **Story Editor:** structure on transcripts, paper edits and assemblies; central question, turning points.
- **Producer:** budgets, funds, co-pro, deadlines.
- **Career Strategist:** the ladder of shorts → IDFAcademy or Berlinale Talents → labs → pitch forums → funds; the editor-to-director bridge.
- **Red Team:** must state the strongest reason a pitch or treatment will be rejected.
- **Field Advisor:** expedition risk checklists; always defers to human experts on safety, permits and the ethics of filming communities.
- **Steward:** wellbeing check-ins, usage-dose monitoring, nudges toward humans. No companion framing, ever. Clinical or crisis content routes to humans.

**The mechanics that carry the evidence.**

1. **Generate-first.** You write the logline, structure or self-critique *before* the AI responds. This counters the competence-later loss Bastani measured.
2. **Scaffold and fade.** Each skill node (observational coverage, character access, feature-length structure, treatment writing, pitching, budgeting, expedition safety) carries an AI-help budget that shrinks as you level up. Periodic unassisted "checkrides" mirror Bastani's no-AI exam ([PNAS](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html)).
3. **Feedback at task and process level only.** Never "great job". Always feed-up, feed-back, feed-forward ([Hattie & Timperley](https://doi.org/10.3102/003465430298487)).
4. **Every critique produces 1–3 atomic lessons**, resurfaced on expanding intervals ([Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354)) and *just before* the related task. Your interview-framing lesson appears the morning of the next interview shoot.
5. **A weekly GROW-style review** ends with one stretch goal and one if-then plan per day type (shoot, travel, edit), plus the question "**which human should you contact this week?**". That last question is the career-function router.

**The Preference Ledger guardrail.** Your Pitch HQ already turns approve, decline and feedback into Style Learnings rules. Keep doing that for *preferences*: tone, format, length, which brands you like. Never let approval train *quality judgments*. Score the mentor on **delayed outcomes** instead: brand reply and booking rates in Pitch HQ, client rehire in the CRM, lab and fund acceptances, unassisted checkride scores. Show its **disagreement rate** on the dashboard. A mentor that disagrees 0% of the time is broken. Information-theoretically, its approval then carries no bits.

### C4. When it speaks: an expected-utility gate with silence as the default

Background attention is already saturated: a **median of 56 phone notifications a day**, with non-messaging notifications converting at only about **15–25%** ([Pielot et al. 2018](https://www.interruptions.net/literature/Pielot-MobileHCI18.pdf)). Interrupted work resumes after an average of **23 min 15 s**, with about two intervening tasks, though that measures time to resume, not cognitive recovery ([Gallup / Gloria Mark](https://news.gallup.com/businessjournal/23146/too-many-interruptions-work.aspx)). Receptivity is learnable: about **70% sensitivity and 80% specificity**, with learned models beating users' own rules ([Mehrotra & Musolesi](https://arxiv.org/pdf/1711.10171)).

Horvitz's mixed-initiative principles say to act only when the expected value of acting exceeds that of not acting, and to weigh the cost of deferring against the cost of interrupting ([Horvitz CHI'99](https://www.erichorvitz.com/chi99horvitz.pdf)). ProAgentBench separates *when to help* from *what to say* ([arXiv 2602.04482](https://arxiv.org/html/2602.04482v1)). Chen et al.'s CHI 2025 study found untimely proactive messages compromise the whole interaction, and that suggestions must be quick to evaluate and easy to dismiss ([arXiv 2410.04596](https://arxiv.org/abs/2410.04596)).

The gate is `U = P(relevant) × value × urgency_decay(t) − C_interrupt(context, surface)`. Deliver now only if U(now) > U(next batch slot), otherwise defer, and "deliver nothing" is a valid output (JITAI, [Nahum-Shani](https://pmc.ncbi.nlm.nih.gov/articles/PMC4732268)). A **separate timing component** (rules plus a learned receptivity model) decides whether and when. The LLM only writes *what*, after the gate passes. That prevents beautifully worded nudges arriving at the wrong moment.

| Tier | Definition | Channel | May break Focus/DND? |
|---|---|---|---|
| **T0 safety / legal** | Travel warning for the current country, severe weather, day limit ≥90%, filing due in 7 days or fewer and unfiled, dead-man check-in missed | P + G, both partners | Yes |
| **T1 perishable opportunity** | Golden hour in 40 min, wind window, client asking "today?" | P or G, **only if receptivity passes** (not driving, not mid-take, not in Resolve playback); otherwise dropped | No |
| **T2 actionable, not perishable** | Invoice reminder, pitch follow-up, upload checklist | Laptop card at the next breakpoint (render started, calendar gap) or the daily digest | No |
| **T3 awareness** | Stats, network, learning, relationships | Weekly digest | No |

**Receptivity signals.** Calendar block type (shoot, edit-deep, travel); motion (driving or flying means defer); just-arrived dwell (a good moment for arrival briefings); Resolve in the foreground with the timeline playing (do not disturb); local time and sleep window; nudges already sent today.

**Budget and routing.**

- At most **about 3 non-T0 pushes per person per day**, and 1–2 glasses glances. These caps are a design choice to re-tune from measured precision.
- Each item goes to the **partner who owns the domain**. Both partners are pinged only at T0.
- Size each nudge to its surface: glasses get 10 words or fewer plus one action ("Golden hour 40 min, clear W"). The phone gets a title, one line and two buttons. The laptop gets the full card with the draft.
- **Every message states its reason** ("because LH123 moved 40 min") and carries a one-tap "never for this", which writes a human-readable suppression rule.
- When P(relevant) sits between 0.4 and 0.7, ask one question in the digest rather than pushing.

### C5. A day in the system: shoot day in the Dolomites

At 06:40 local, the 08:00 digest has already been written on the hub overnight. Because today's calendar block is "shoot", it is delivered early and trimmed to four lines: sunrise and wind, the backup status of yesterday's cards, one client deliverable due tomorrow, and nothing else.

At 07:10 the gust forecast at the ridge exceeds the drone's limit after 11:00. That is a T1 push to Micha only: "Gusts >40 km/h after 11:00 — fly first." Guada owns logistics, so the hut booking confirmation goes to her as an L4 templated send that she pre-approved as a class.

From 09:00 to 15:00, nothing. Motion and calendar say mid-shoot, so three brand emails are triaged silently and one pitch follow-up is drafted into Pitch HQ.

At 16:30, ingest finishes on the laptop. The production node verifies checksums and 3-2-1 copies, updates the TwelveLabs index, and posts one L card with the selects outline. The Story Editor does *not* write the scene. It asks two questions and waits for Micha's own one-line scene intent first.

At 18:55, a glasses glance: "Blue hour 20 min, clear W."

At 21:30, the evening digest offers the pitch follow-up for approval (R2, one tap on the watch), one atomic lesson from last week's interview critique (because tomorrow's calendar has an interview), and the weekly question queued for Sunday: "Which commissioner haven't you spoken to in 90 days?"

Total interruptions: two pushes and one glance.

### C6. Making it work 24/7: run it like a tiny production service

**Two planes.** The **deterministic plane** (cron and queue jobs: deadline ladders, day counters, API polls, backups) never depends on an LLM to fire. If the LLM plane fails, the raw alert goes out on a template.

**Idempotency.** Every nudge has the key `hash(domain, entity_id, trigger, window)` in a sent-ledger, so restarts never double-notify.

**Failure handling.** Retries use backoff and jitter. A circuit breaker per source raises a "source degraded" item. An empty or schema-invalid response counts as a failure, not as "no news": the unofficial Auswärtiges Amt client returns `{}` on error, which a naive agent would read as "no warnings" ([PyPI de-travelwarning](https://pypi.org/project/de-travelwarning/)).

**Time zones.** Deadlines are stored in UTC with the jurisdiction's legal time zone attached (US Eastern for the IRS, Mountain for Wyoming). Delivery windows are computed in *your current* time zone. Tests cover date-line and DST crossings, because nomads generate off-by-one-day bugs for a living.

**Data licences.** Weather comes from Open-Meteo, whose free API is **non-commercial only, under 10,000 calls/day**. A monetised channel needs the commercial licence or a self-hosted AGPL instance ([Open-Meteo terms](https://open-meteo.com/en/terms)).

**Heartbeats and canaries.** Every job pings its own Healthchecks.io check. The free tier covers **20 checks**, and a check goes "Down" after Period + Grace ([Healthchecks.io](https://HealthChecks.io)). A top-level "agent alive" check and an inverse "digest arrived by 08:00" check alert through a **different channel** (SMS or email), so a dead agent can't silence its own alarm. A synthetic fake deadline is injected weekly and must surface on schedule, which tests the full path from scheduler to ranking to delivery.

**Observability.** Langfuse runs self-hosted, or on Cloud Hobby (free, **50k units/month, 2 users**), with online LLM-as-judge plus code evaluators on every delivered nudge ([Langfuse](https://langfuse.com/docs/evaluation/get-started/online.md)).

| SLO | Target | Error budget |
|---|---|---|
| **SLO-1 legal & safety** | 100% of T0 deadlines alerted at 2 or more ladder points before the due date | **0**. Any miss gets a blameless postmortem. |
| **SLO-2 freshness** | Safety sources polled successfully at least every 12 h | 99% |
| **SLO-3 digest** | Daily digest by 08:00 local; weekly review by Sunday 18:00 | 99% of days |
| **SLO-4 nudge precision** | Useful-interruption rate ≥60% (rolling 14 days); annoyance (👎 or "never") ≤10% | Heuristic, set well above the 15–25% generic notification conversion |
| **SLO-5 perishable lead time** | T1 alerts with ≥30 min lead time | 95% |

**Change management.** A **golden set of 50–200 frozen scenarios** (context snapshot plus expected decision: push, digest or silent, and to which partner) includes negative cases where silence is correct. It runs as a regression gate on every prompt, model or rule change. Every new nudge type launches in **shadow mode**: logged and judge-scored but not delivered, promoted only when shadow precision meets the target. The weekly self-audit reports SLOs, the top 5 misfires with root causes, degraded sources and the next 90 days of deadlines, and proposes rule changes for one-tap approval.

---

## Next steps, ordered by expected loss avoided per hour

| When | Step | Done when |
|---|---|---|
| **Day 1** | Harden OpenClaw: localhost + Tailscale, remove all ClawHub skills, patch past CVE-2026-25253, give it a separate low-privilege Google account | Port 18789 unreachable from the internet; skills list empty or self-written |
| **Day 1** | Ask Guada's nationality and record it. Book a Steuerberater + US CPA review of German residence exposure, Wyoming SMLLC treatment in Germany, and 5472 scope | Both facts stored as L3 memory with sources |
| **Week 1** | Hub: EU VPS + Postgres job queue or n8n; deterministic deadline ladder (5472/1120, Wyoming report, registered agent, passports, insurance, domains); Healthchecks dead-man switches; 08:00 digest to phone | First canary surfaces on time |
| **Weeks 2–3** | Memory MCP server (Postgres + pgvector); Notion Pitch HQ, CRM and Content Pipeline as projections; Style Learnings → Preference Ledger plus a separate outcome table | Pitch reply and booking rates visible next to rules |
| **Weeks 3–4** | Policy layer: R0–R3 classes, per-capability OAuth, untrusted-provenance tags, watch/phone approvals | No R2/R3 action possible without a logged tap |
| **Month 2** | Laptop production node: local MCP for Resolve scripting, Remotion, TwelveLabs; ingest → backup verification → selects card | Ingest card appears unprompted after a shoot |
| **Month 2** | Mentor layer v1: Story Editor + Red Team + fund/lab deadline radar; generate-first rule; weekly review | First unassisted checkride logged |
| **Month 3** | Shadow mode for all T1/T2 nudges → promote on precision; golden set ≥50 scenarios | SLO-4 measured for 14 days |
| **Month 3** | Film episodes 1–4 of the build; open a waitlist for the "Creator Ops System Setup" at €2.5–5k on formatschnitt.de and micharoessler.com | 2 paid setups booked |
| **2027 Q1** | Re-evaluate glasses: Even G2 teleprompter pilot; check Android XR distribution | One week of shoots using the HUD |

---

## Conclusion

The research reframes what a "Life OS" is. It is not an assistant that does more. It is a **bounded agency contract**: which functions the machine owns, which it drafts, which it only questions, and which it must never optimise. The delegation literature sets where those lines sit (periphery automated, creative and relational core protected), and the mentoring literature sets how the protected core still gets better (generate-first, scaffold-and-fade, outcome-calibrated critique, routing to human sponsors). The engineering consequence is that the most important component isn't the model. It is the deterministic plane and the attention gate, the boring parts that let the system stay quiet 95% of the time and be trusted the other 5%.

The business consequence is just as counterintuitive. Labs commoditising proactive AI is good news for this niche, because each launch makes the substrate cheaper and the vertical configuration (jurisdiction days, LLC calendars, footage pipelines, couple decision rights, expedition safety) relatively more valuable. You are well placed to sell that configuration, as long as you sell it as a studio sells a system, not as a startup sells an app, and as long as the system's first customer remains the documentary you haven't made yet.

## The single best next step

**Spend one day standing up the hub and putting a leash on what already runs.** Rent an EU VPS on Tailscale. Move the OpenClaw gateway onto it, bound to localhost, with zero ClawHub skills and patched past CVE-2026-25253. Then add the first deterministic job: the LLC, passport and insurance deadline ladder, with a Healthchecks.io dead-man switch on an 08:00 phone digest. It removes your largest current downside (an exposed agent holding your accounts), creates the one component everything else depends on, and is episode 1 of the series that sells the product.
