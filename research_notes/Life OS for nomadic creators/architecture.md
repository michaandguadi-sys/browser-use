# Life OS Architecture: State of the Art for a Secure, Multi-Device, Ambient-but-Proactive Personal Agent (as of 26 Oct 2026)

Scope: one power user (nomadic filmmaker, unreliable internet, laptop running DaVinci Resolve/Remotion, phone, wants AI glasses; already uses Claude, Notion, Google Workspace, MCP connectors, OpenClaw).

Method note: most product facts below come from web searches run on 26 Oct 2026. Several primary-source fetches (developers.meta.com, android-developers.googleblog.com, arxiv.org, simonwillison.net, docs.openclaw.ai) failed with DNS errors from the research sandbox, so many claims rely on search-result summaries of those pages plus secondary press. The confidence of each claim is marked where it matters. "UNVERIFIED" means a single secondary source, or sources that conflict.

---

## 1. AI glasses landscape 2026: SDKs, sensor access, battery, price, realistic integration targets

### Takeaway
Meta is the only vendor with a stable, shipping, third-party SDK that gives camera and mic access on a mass-market pair of glasses: Wearables Device Access Toolkit (DAT) 1.0, rolling out from 30 Sep 2026, covering Ray-Ban Meta, Oakley Meta, and Ray-Ban Display, which now has display access. Even Realities G2 is the best open target if you want a camera-less, bystander-friendly HUD. Android XR glasses (Samsung/Warby Parker/Gentle Monster) and Xreal Aura ship this fall, but there is no public app-distribution channel yet. Apple glasses are a late-2027 rumor. Integrate with Meta DAT and Even Hub now. Design the glasses layer as a thin, swappable "sensor + glanceable display" edge.

### Cited Findings

**Meta Ray-Ban Display + Neural Band**
- Price is $799 including the Neural Band. It launched 30 Sep 2025 in select US stores and requires a demo appointment to buy. Expansion to Canada, France, Italy and the UK was planned for early 2026. — [Tom's Guide](https://www.tomsguide.com/computing/smart-glasses/meta-ray-ban-display-glasses-features-neural-link-price-and-availability); [UploadVR](https://www.uploadvr.com/meta-ray-ban-display-glasses-officially-announced/); [Mobile Dev Memo](https://mobiledevmemo.com/at-799-is-the-meta-ray-ban-display-cheap/)
- Battery is about 6 h mixed use, or about 30 h with the charging case. The Neural Band lasts up to 18 h and is rated IPX7. The display is a monocular HUD with about a 20° FoV and up to 5,000 nits. The band uses sEMG wrist input. — [vanja.io review](https://vanja.io/meta-ray-ban-display-review/); [NEU deep dive](https://cse.neu.ac.bd/tech-news/1/)
- Display access for third-party developers opened in developer preview on 14 May 2026. — [Auganix](https://www.auganix.org/ar-news-ray-ban-display-developer-preview/); [gHacks](https://www.ghacks.net/2026/05/18/meta-opens-ray-ban-display-glasses-to-third-party-developers-through-wearables-toolkit/); [vr.org](https://vr.org/articles/meta-ray-ban-display-developer-sdk-2026)
- Meta's FAQ says DAT 1.0 is "a stable, supported release" after a year in developer preview, rolling out from 30 Sep 2026. Android and iOS SDKs are on GitHub, along with web-app starter kits. — [Meta Wearables FAQ](https://developers.meta.com/wearables/faq/) (seen via search snippet; a direct fetch failed)
- There are two build paths:
  - **Native DAT**: an iOS/Android SDK (Swift/Kotlin) that extends your phone app to the glasses and exposes camera and mic.
  - **Web Apps**: HTML/CSS/JS served over HTTPS, with no camera access.
  
  — [GlassKit explainer](https://glasskit.app/docs/meta-ray-ban-display-sdk-explained); [Meta display overview](https://wearables.developer.meta.com/docs/develop/dat/display-overview/)
- Camera API: `MWDATCamera` handles resolution and frame-rate selection, start/stop streaming, and single-frame capture. — [Meta DAT integration overview](https://wearables.developer.meta.com/docs/develop/dat/build-overview/)
- Mic constraint (important for an always-on audio pipeline): mic input runs over Bluetooth HFP at **8 kHz mono**. HFP and A2DP cannot run concurrently, so output drops to 8 kHz mono during a session. Only one DAT session runs per device at a time. Full toolkit access is limited to countries where Meta AI glasses are supported. — [Meta DAT microphones & speakers](https://wearables.developer.meta.com/docs/develop/dat/microphones-and-speakers/); [Meta DAT build overview](https://wearables.developer.meta.com/docs/build-overview/)

**Google Android XR glasses**
- Samsung's glasses were unveiled at Galaxy Unpacked on 22 Jul 2026, "scheduled to launch this fall in select markets". They are **audio glasses with no display**: camera, mics, open-ear speakers, Warby Parker / Gentle Monster frames, phone-paired, with Gemini doing the work. Price is undisclosed. One outlet reports November 2026 (UNVERIFIED). — [Sean Kim blog summarizing Unpacked](https://blog.imseankim.com/google-android-xr-smart-glasses-fall-2026/); [Google blog, Android Show XR](https://blog.google/products/android/android-show-xr-edition-updates/); [Android Authority](https://www.androidauthority.com/android-xr-glasses-preview-google-io-2026-3665773/)
- Gentle Monster and Gucci devices are reportedly 2027. Warby Parker gave no pricing. — [MarketScreener](https://uk.marketscreener.com/news/warby-parker-google-to-launch-ai-powered-smart-glasses-in-2026-ce7d51d2d889f025)
- SDK: Android XR SDK Developer Preview 3 per Google, or DP4 at I/O 2026 per later coverage (CONFLICT). It includes glasses libraries, a glasses UI framework, and an emulator with touchpad input and limited FoV. — [vr.org](https://vr.org/articles/android-xr-sdk-developer-preview-3-glasses-development); [byteiota](https://byteiota.com/android-xr-glasses-at-i-o-2026-sdk-is-ready-to-use/)
- As of July 2026, Play distribution covers only XR headsets and wired XR glasses, with no public channel for audio/display glasses. — [Extentos](https://extentos.com/blog/android-xr-glasses-for-developers); [Extentos Android XR doc](https://extentos.com/docs/ecosystem/platforms/android-xr)

**Xreal Project Aura (Android XR, tethered)**
- Xreal says it will cost no more than $1,500. A $1,279 start price and a November 2026 ship date appear in trackers (UNVERIFIED). Specs: 70° optical see-through FoV, under 95 g, tethered compute puck, Gemini. First wave in the US, UK, Japan, Canada and Korea, with the EU later. — [9to5Google](https://9to5google.com/guides/xreal-project-aura/); [Engadget](https://engadget.com/2194861/xreal-aura-android-xr-glasses-launch-no-price); [The Gadgeteer](https://the-gadgeteer.com/2026/06/29/xreal-aura-xr-glasses-practical-1500/); [idevice tracker](https://idevice.com/smart-glasses/xreal-aura/roadmap)

**Even Realities G2 (+ R1 ring)**
- G2 is $599 and the R1 ring is $249. Launched 12 Nov 2025. No camera. BLE 5.4. Display is about 576×288 per eye per the dev docs, versus 640×350 on the consumer sheet (CONFLICT). — [Auganix](https://www.auganix.org/ar-news-even-realities-g2-r1/); [TechEBlog](https://www.techeblog.com/even-realities-g2-smartglasses-specs-price-release-date/); [Extentos Even doc](https://extentos.com/docs/ecosystem/platforms/even-realities); [idevice](https://idevice.com/smart-glasses/even-realities/roadmap)
- Even Hub, the third-party platform:
  - Apps are web apps running in the phone app's WebView. An injected bridge relays to the glasses over BLE.
  - The SDK is `@evenrealities/even_hub_sdk`, v0.0.10 (2026-04-10). It covers display, input, audio, device info and local storage. A desktop simulator is available.
  - Apps are packaged as `.ehpk`, go through beta groups, and are submitted for review. A self-hosted PWA is an alternative.
  - "The phone thinks, the glasses show, the ring decides."
  
  — [Even Hub architecture docs](https://hub.evenrealities.com/docs/getting-started/architecture); [Even Hub glossary](https://hub.evenrealities.com/docs/reference/glossary); [Even blog](https://www.evenrealities.com/en-FR/blogs/even-insider/the-unfinished-glasses)

**Brilliant Labs Halo**
- $399, just over 40 g. 0.2" color micro-OLED, bone-conduction audio, camera, on-device NPU. Open-source and developer-oriented, but the software is "early". — [Treeview](https://treeview.studio/blog/best-smart-glasses); [Wikipedia](https://en.wikipedia.org/wiki/Brilliant_Labs)

**Snap Specs (consumer, 2026)**
- Pre-order at $2,195, shipping fall 2026. Standalone AR with no phone or puck. — [Treeview](https://treeview.studio/blog/best-smart-glasses) (single secondary source, UNVERIFIED)

**Rokid**
- AI glasses with translation, captions, camera and Gemini/GPT assistance. No SDK or pricing details found. — [Treeview companies list](https://treeview.studio/blog/best-smart-glasses-companies)

**Apple glasses (RUMOR)**
- Gurman reports that N50 has slipped from a late-2026 reveal to a late-2027 launch. No display in v1. Part of a strategy alongside AirPods and a camera pendant feeding Siri. At least four frame styles are being tested. Rumored price is $200–500. Relies on the iOS 27 Siri. — [Tom's Guide](https://www.tomsguide.com/computing/smart-glasses/despite-googles-ai-glasses-push-apples-answer-is-now-expected-in-2027-while-vision-air-wont-be-here-until-at-least-2028); [Smartprix](https://www.smartprix.com/bytes/mark-gurman-apple-delays-smart-glasses-launch-to-late-2027-vision-air-pushed-to-2028-2029/); [TechSpot](https://www.techspot.com/news/112064-apple-tests-four-smart-glasses-designs-prepares-directly.html); [The Decoder](https://the-decoder.com/apple-is-building-smart-glasses-without-a-display-to-serve-as-an-ai-wearable/)

### Inferences
- **Realistic integration targets now (Oct 2026):**
  1. Meta DAT 1.0 for camera capture and a HUD on Ray-Ban Display.
  2. Even Hub on G2 for a camera-less teleprompter, notification and glance HUD. This is very relevant for a filmmaker doing shot lists or scripts, and it sidesteps bystander-privacy friction.
  3. Brilliant Halo for hackability.
  
  Android XR glasses are a "watch" item for Q1 2027 once distribution opens.
- **The 8 kHz HFP mic path on Meta DAT is bad for high-quality transcription.** Treat glasses audio as command/wake capture. Do serious transcription on phone or laptop mics.
- **Every glasses SDK is phone-hosted** (DAT native app, Even Hub WebView, Android XR projected from phone). The phone is therefore the real edge compute node, and the glasses are I/O peripherals. Architecturally, a single "phone edge agent" app that speaks to whichever glasses SDK is present gives vendor portability.
- **Battery:** about 6 h on Ray-Ban Display means it cannot be the 24/7 sensor. The ambient layer must degrade gracefully when glasses are off.

### Gaps
- Exact DAT 1.0 changelog, whether Neural Band gestures are exposed to third parties, whether apps can invoke or replace Meta AI, and camera resolution caps. The FAQ fetch failed.
- Battery life for Even G2, Halo, Samsung glasses and Snap Specs was not found in reliable sources.
- No Rokid developer-program details were found.
- No confirmed Android XR glasses price or Play distribution policy for display/audio glasses.

---

## 2. Phone-level agents: Siri/App Intents 2026, Gemini/AppFunctions, Shortcuts, push, background limits

### Takeaway
Both mobile OSes have converged on "apps expose typed functions that the system agent orchestrates":
- **Apple**: App Intents. Reports say SiriKit was deprecated at WWDC 2026 and that iOS 27 Siri is Gemini-backed with a third-party "Extensions" model.
- **Google**: AppFunctions, framed as on-device "Android MCP" in Android 17. Gemini integration is still in private preview.

For a personal Life OS, these are delivery and actuation surfaces, not the brain. The 24/7 orchestrator must live off-phone because of OS background-execution limits.

### Cited Findings
- **Android 17 / AppFunctions.** Google describes AppFunctions as a platform API plus Jetpack library that lets apps contribute capabilities as "tools" for **Android MCP**, the on-device counterpart to MCP. Agents such as Gemini discover and execute them using the app's local state. Gemini integration is in private preview with trusted testers as of May 2026. There is an early access program (goo.gle/eap-af), the Jetpack library is in alpha, and Google provides a test-agent app. — [Android Developers Blog: Android 17 is here](https://android-developers.googleblog.com/2026/06/Android-17.html); [developer.android.com mirror](https://developer.android.com/blog/posts/android-17-is-here?hl=en); [AppFunctions overview](https://developer.android.com/ai/appfunctions); [Feb 2026 "Intelligent OS" post](https://android-developers.googleblog.com/2026/02/the-intelligent-os-making-ai-agents.html)
- **iOS 27 / WWDC 2026 (June 2026).** Secondary sources report:
  - SiriKit was formally deprecated in favor of App Intents, with a 2–3 year removal window.
  - Siri cloud processing runs on a custom Google Gemini model, with on-device requests on Apple models.
  - An "Extensions" framework lets users choose Claude, ChatGPT or Gemini as backends.
  
  Several of these pages are SEO guides that contradict each other on details, so treat this as UNVERIFIED pending developer.apple.com. — [TechTimes](https://www.techtimes.com/articles/318005/20260608/wwdc-2026-app-intents-replaces-sirikit-gemini-siri-migration-clock-starts.htm); [digitalapplied](https://www.digitalapplied.com/blog/apple-siri-ios-27-extensions-claude-gemini-chatgpt-guide); [wowhow](https://wowhow.cloud/blogs/apple-wwdc-2026-ios-27-siri-extensions-claude-gemini-chatgpt-developer-guide); [lushbinary](https://lushbinary.com/blog/wwdc-2026-announcements-ios-27-siri-developer-guide/)
- A public `LanguageModel` protocol in the Foundation Models framework, which would let apps swap on-device and third-party models, is reported by one secondary source (UNVERIFIED). — [beam.ai](https://beam.ai/agentic-insights/apple-wwdc-2026-ios-27-agent-extensions-enterprise)
- **Claude's own phone surfaces.** Claude Cowork Dispatch links the mobile app to Claude Desktop:
  - Work executes on the desktop, which must be awake with the app open.
  - Push notifications arrive when a task finishes or needs approval.
  - Requires Pro/Max on macOS/Windows. Computer use is unavailable on Linux.
  
  Anthropic's help center now says "Claude Cowork is now just Claude" and that Dispatch is not available to new users. — [Claude docs: Dispatch](https://claude.com/docs/cowork/guide/dispatch); [Anthropic support article](https://support.claude.com/en/articles/13947068-assign-tasks-to-claude-from-anywhere-in-cowork)

### Inferences
- **Use the phone OS agent as the "last mile":**
  - Expose a small set of App Intents / AppFunctions from a companion app: "log shot", "capture idea", "approve pending action", "what's next".
  - Siri or Gemini then becomes a voice front door.
  - Ambient prompts are delivered via standard push (APNs/FCM) with interruption levels.
  
  Reliable push-API and background-limit specifics were not freshly researched. See Gaps.
- **Don't host the orchestrator on the phone.** iOS background execution is opportunistic (BGTaskScheduler), and Android 15+ tightened foreground-service types. This is established platform behavior from training knowledge and was not re-verified in 2026 sources.
- **Dispatch-style "phone remote for a desktop agent" depends on the laptop being awake.** That is a poor fit for a traveler whose laptop sleeps in a bag. A cloud or VPS host is needed for 24/7 duties.

### Gaps
- Official Apple developer docs for iOS 27 App Intents, Siri Extensions and Foundation Models were not retrieved. Treat the Gemini-Siri details as press reports.
- iOS 27 / Android 17 changes to push notification APIs (interruption levels, Live Activities, notification summaries) and background execution quotas were not researched with 2026 sources.
- Gemini Live / Gemini "app actions" 2026 developer access was not specifically verified beyond AppFunctions.

---

## 3. Agent interoperability standards: MCP, A2A, AP2, ACP, AAIF

### Takeaway
MCP (spec **2026-07-28**, under the Linux Foundation's Agentic AI Foundation) is the stable bet for tools and data. A2A **v1.0** (March or April 2026, LF-governed, 150+ orgs) is the stable bet for agent-to-agent delegation, but it is overkill for a single-user system unless you federate with third-party agents. Payment protocols are not yet stable:
- **AP2**: Google, reportedly moved to FIDO.
- **ACP**: OpenAI/Stripe, reportedly pivoted.
- **UCP**: Google.

Gate any money movement behind human approval regardless.

### Cited Findings
- **MCP 2026-07-28** (released 28 Jul 2026), from the official release post:
  - **Stateless core.** The initialize/initialized handshake and the `Mcp-Session-Id` header are retired (SEP-2575, SEP-2567). Each request carries protocol version, client identity and capabilities in `_meta`. `server/discover` is optional.
  - **Multi Round-Trip Requests** (SEP-2322) replace server-initiated sampling, elicitation and roots over held-open streams.
  - **Routing and caching.** `Mcp-Method` and `Mcp-Name` headers are required on Streamable HTTP (SEP-2243). List results are cacheable with `ttlMs` and `cacheScope` (SEP-2549).
  - **Authorization:**
    - RFC 9207 `iss` validation (SEP-2468).
    - `application_type` in DCR for localhost redirects (SEP-837).
    - Issuer-bound client credentials (SEP-2352).
    - **Client ID Metadata Documents (CIMD) preferred.** DCR is deprecated but still works.
  - **Tasks** move to the `io.modelcontextprotocol/tasks` extension (SEP-2663), with `tasks/get` and `tasks/update`.
  - `subscriptions/listen` stream.
  - Formal extensions framework, including MCP Apps and Enterprise Managed Authorization.
  - **Deprecated:** Roots, Sampling and Logging (SEP-2577), with at least 12 months of support. The HTTP+SSE transport is also deprecated, with a year-long offramp. A formal 12-month deprecation policy now applies.
  - Tier 1 SDKs (TS, Python, Go, C#) support it. Rust is in beta.
  
  — [MCP blog: The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/); [MCP versioning](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning); [GitHub source of post](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/blog/content/posts/2026-07-28-spec-ga/index.md)
- Prior final versions: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25. — [MCP versioning](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning)
- The C# SDK v2.0 implements 2026-07-28. — [.NET Blog](https://devblogs.microsoft.com/dotnet/announcing-v20-of-the-official-mcp-csharp-sdk/). Google and Cloudflare published scaling and migration posts. — [Google Developers Blog](https://developers.googleblog.com/scaling-ai-agent-infrastructure-with-the-mcp-stateless-updates/); [Cloudflare](https://blog.cloudflare.com/mcp-v2); [AAIF migration post](https://aaif.io/blog/mcp-2026-07-28-whats-changing-and-how-to-migrate)
- **Agentic AI Foundation (AAIF).** The Linux Foundation formed it in Dec 2025 with inaugural projects MCP (Anthropic), goose (Block) and AGENTS.md (OpenAI). Platinum members: AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI. A later profile lists agentgateway and A2A as projects (UNVERIFIED). Working groups were established by May 2026. — [InfoQ](https://infoq.com/news/2025/12/agentic-ai-foundation/); [It's FOSS](https://itsfoss.com/news/agentic-ai-foundation-launch/); [ai.engineer profile](https://www.ai.engineer/orgs/agentic-ai-foundation); [SAP architecture docs](https://architecture.learning.sap.com/docs/global-standards-for-agentic-ai/agentic-ai-foundation)
- **A2A.**
  - Donated by Google to the LF in Jun 2025. The LF press release of 9 Apr 2026 cites 150+ organizations, major clouds and enterprise production use.
  - v1.0 shipped in March 2026 per Google's OSS blog, or April per other sources.
  - v1.0 added Signed Agent Cards, an AP2 extension, multi-tenancy, and JSON-RPC/gRPC/HTTP+JSON bindings.
  - Apache 2.0, with SDKs in Python, Go, JS, Java and .NET.
  
  — [Linux Foundation press release](https://linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year); [Google OSS blog](https://opensource.googleblog.com/search/label/A2April?m=0); [letsdatascience](https://letsdatascience.com/news/a2a-solidifies-cross-vendor-agent-interoperability-53400ea4)
- **AP2.** Google announced it in Sep 2025, based on signed mandates. It was reportedly contributed to the FIDO Alliance in Apr 2026 (UNVERIFIED). Production maturity is contested: one table says "Production" with Mastercard, PayPal, Amex and Visa, while a tracker finds no verified third-party production deployments. — [vktr](https://www.vktr.com/digital-experience/google-pushes-standards-for-agentic-ai-commerce-with-ap2/); [eco.com comparison](https://eco.com/support/en/articles/14839407-agent-payment-protocols-compared); [Lumar AP2 tracker](https://agentic-readiness.lumar.io/docs/commerce/ap2.md)
- **ACP (OpenAI + Stripe).** Reportedly "pivoted to discovery" in March 2026 (UNVERIFIED, details unconfirmed). Google's UCP launched Jan 2026. — [cipherprojects comparison](https://cipherprojects.com/blog/posts/agentic-commerce-protocols-mcp-a2a-acp-ap2-compared/); [stellagent](https://stellagent.ai/insights/mcp-vs-a2a-vs-ap2-protocol-comparison); [Wikipedia: Agentic commerce](https://en.wikipedia.org/wiki/Agentic_commerce)

### Inferences
- **Stable bets:**
  - MCP 2026-07-28 with Streamable HTTP + CIMD auth for every tool and data integration (Notion, Google Workspace, your own memory server, a Resolve/Remotion control server).
  - A2A v1.0 only at the boundary, if you expose your agent to others or consume vendor agents.
- **Watch the deprecations.**
  - Avoid building new things on Sampling, Roots or HTTP+SSE, since they are deprecated.
  - Use the Tasks extension for long jobs such as renders, transcodes and uploads. Its poll-based `tasks/get` suits flaky connectivity better than held-open streams.
- **Stateless MCP plus cacheable list results suit intermittent networks.** A local MCP gateway can cache tool lists and replay queued calls on reconnect.
- **Payments protocols are churning.** Use none of them autonomously. Treat purchases as "draft + human approve" via existing card or Stripe flows.

### Gaps
- No primary AP2/FIDO or ACP/Stripe pages were retrieved, so the current status of both is uncertain.
- The exact A2A v1.0 release date is unconfirmed (March vs April 2026).
- The AAIF current project roster (whether A2A formally moved under AAIF or remains a separate LF project) is unclear.

---

## 4. Always-on agent runtimes: OpenClaw, alternatives, hosting, durability

### Takeaway
OpenClaw is a powerful but historically insecure always-on personal agent. It uses a gateway on WebSocket port 18789, multi-channel chat, a 30-minute heartbeat and cron. Its 2026 track record:
- Tens of thousands of exposed instances, caused by a 0.0.0.0 default bind.
- Hundreds of malicious ClawHub skills carrying macOS infostealers.
- A one-click RCE (CVE-2026-25253, CVSS 8.8).

Keep it only if it is sandboxed, has no ClawHub skills, sits behind Tailscale/WireGuard, and is patched. Otherwise move the scheduler and durability to a boring durable-execution layer (Temporal/Inngest/Trigger.dev, or n8n for lightweight flows) and use Claude Code routines or the Agent SDK as the reasoning worker.

### Cited Findings
- **History.**
  - Started as Clawdbot (Nov 2025; originally "Warelay").
  - Renamed to Moltbot in late Jan 2026 after Anthropic objected, then to OpenClaw on 30 Jan 2026.
  - Scammers hijacked the old handle to promote a fake $CLAWD token.
  - Creator Peter Steinberger joined OpenAI in Feb 2026 (reportedly 14 Feb). OpenAI did not acquire the project, which is now under an "OpenClaw Foundation".
  
  — [Wikipedia: OpenClaw](https://en.wikipedia.org/wiki/OpenClaw); [morphllm](https://www.morphllm.com/clawdbot); [Neowin](https://www.neowin.net/news/openclaws-founder-peter-steinberger-is-joining-openai/)
- **Architecture.**
  - A Gateway process acts as WebSocket control plane (default port 18789) and process manager. It bridges the LLM and execution, manages chat channels, and runs the heartbeat loop.
  - Cron is the built-in persistent scheduler, which can deliver output to a chat channel or webhook.
  - Heartbeat is a periodic agent turn in the main session (default 30 min, tasks in `HEARTBEAT.md`) that creates no background task records.
  - Exact reminders belong in cron, not heartbeat.
  - `openclaw system` can enqueue events for the next heartbeat or trigger one immediately.
  
  — [OpenClaw docs: Automation](https://docs.openclaw.ai/automation); [heartbeat.md in openclaw@2026.6.6 package](https://app.unpkg.com/openclaw@2026.6.6/files/docs/gateway/heartbeat.md); [clawdocs architecture (3rd party)](https://clawdocs.org/architecture/overview); [clawdocs heartbeat](https://clawdocs.org/architecture/heartbeat); [heyuan110 deep dive](https://www.heyuan110.com/posts/ai/2026-02-14-openclaw-architecture-deep-dive/)
- **Security incidents.**
  - **Exposed instances.** SecurityScorecard STRIKE counted 30,000+ internet-exposed instances. Another tracker claims 135,000+ across 82 countries. The default bind of 0.0.0.0:18789 is the root cause. — [DigitalOcean](https://www.digitalocean.com/resources/articles/openclaw-security-challenges); [Hive Security](https://hivesecurity.gitlab.io/blog/openclaw-ai-agent-security-crisis-2026/); [cyberdesserts](https://blog.cyberdesserts.com/openclaw-malicious-skills-security/)
  - **Malicious skills.** Koi Security found 341 malicious skills in an audit of 2,857. Bitdefender estimated about 900, or roughly 20% of packages. The "ClawHavoc" campaign bundled AMOS macOS infostealers disguised as Gmail, Notion, Slack and GitHub integrations. Even after VirusTotal and ClawScan screening, Unit 42 found five unblocked malicious skills, two with macOS infostealers phoning C2. — [Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/); [Dark Reading](https://www.darkreading.com/cyber-risk/malicious-openclaw-skills-clawhub-threaten-ai-supply-chain); [clawtrust](https://clawtrust.ai/blog/openclaw-security-341-malicious-skills-and-what-we-do-about-it)
  - **CVE-2026-25253 (CVSS 8.8).** One-click RCE: the Control UI accepted a gateway URL from the query string and sent the auth token there without confirmation. A vendor blog claims "543 CVEs" in total (UNVERIFIED). — [Immersive Labs](https://www.immersivelabs.com/resources/c7-blog/openclaw-what-you-need-to-know-before-it-claws-its-way-into-your-organization); [betterclaw](https://www.betterclaw.io/blog/openclaw-security-2026)
- **Claude Code Routines** (research preview, April 2026). Cloud-hosted runs on Anthropic infrastructure that work when your machine is off.
  - Triggers: schedule (hourly/daily/weekdays/weekly, minimum 1 h), API, GitHub webhook.
  - Each routine bundles prompt + repo + connectors.
  - Daily caps reported as Pro 5, Max 15, Team/Enterprise 25 (secondary).
  - Desktop scheduled tasks, by contrast, run locally and need the machine on.
  
  — [The Register, 14 Apr 2026](https://www.theregister.com/2026/04/14/claude_code_routines/); [The New Stack](https://thenewstack.io/claude-code-can-now-do-your-job-overnight/); [implicator](https://www.implicator.ai/anthropic-ships-claude-code-routines-cloud-automations-that-run-without-your-mac/); [DataCamp](https://datacamp.com/tutorial/claude-code-routines)
- **Cowork scheduled tasks** (`/schedule`; hourly/daily/weekly/weekdays) run on the desktop. One guide dates them to 25 Feb 2026 (UNVERIFIED). — [fast.io](https://fast.io/resources/claude-tasks-guide/); [Claude Dispatch docs](https://claude.com/docs/cowork/guide/dispatch)
- **Durable execution.** It persists each step and retries only failed steps. Inngest, Trigger.dev and Temporal dominate. Temporal integrated with the OpenAI Agents SDK in 2025 and the Vercel AI SDK in early 2026. n8n 2.0 adds isolated task runners and 70+ AI nodes, and the Community Edition self-hosts free. — [noqta](https://www.noqta.tn/blog/durable-execution-ai-agents-inngest-trigger-temporal-2026); [metavert n8n vs Temporal](https://metavert.io/compare/n8n-vs-temporal); [automationatlas n8n](https://automationatlas.io/guides/building-ai-agents-with-n8n-2026/)
- **Letta** (formerly MemGPT) is a stateful agent runtime with core, recall and archival memory tiers. It is free to self-host, or $20/mo Pro. — [atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/); [developersdigest](https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026)

### Inferences
- **Hosting for a nomad.**
  - A home server or Mac mini is only good if home power and ISP are reliable and someone can reboot it. Nobody is home, so it becomes a single point of failure reached via Tailscale.
  - A small EU VPS (Hetzner-class, 4–8 GB RAM) is the pragmatic 24/7 brain host. It is always reachable, cheap, and has a fixed GDPR jurisdiction.
  - Claude Code routines are a complementary zero-ops cloud scheduler for once-per-hour-or-slower jobs (digests, inbox triage), subject to daily caps.
  - The laptop is an intermittently connected edge node with local models and Resolve control. It is never the scheduler.
- **Durability patterns to adopt:**
  1. A durable workflow engine or a Postgres-backed job queue, with idempotency keys on every side-effecting tool call.
  2. Exponential-backoff retries plus a dead-letter queue surfaced in a daily digest.
  3. An outbound heartbeat from each node to an external dead-man's-switch monitor (e.g., a healthchecks-style ping service), so silence pages you via a channel independent of the agent. That channel could be SMS or email.
  4. Store-and-forward outbox queues on phone and laptop for offline capture.
  5. Separate "heartbeat turns" (cheap, model-light triage) from "cron jobs" (exact-time), mirroring OpenClaw's own distinction.
- **If keeping OpenClaw:**
  - Bind to localhost and use Tailscale only.
  - Run it in a container or VM with no host home directory mounted.
  - Install no ClawHub skills. Write your own or pin vetted MCP servers.
  - Give it a separate low-privilege Google account / OAuth scopes.
  - Patch past CVE-2026-25253.

### Gaps
- The current OpenClaw release version, and whether the default bind was changed to localhost after the incidents. The docs fetch failed. The package was seen at v2026.6.6.
- Official Anthropic docs for Routines limits and pricing were not retrieved. Plan caps come from secondary sources.
- LangGraph 2026 status, Temporal pricing for a single user, and Letta's 2026 version were not specifically researched.

---

## 5. Memory architectures: long-term memory, local-first, vector + graph, user-owned, portability

### Takeaway
The 2026 options cluster into three shapes:
- **Mem0**: vector-first, fact extraction.
- **Zep/Graphiti**: a temporal knowledge graph with bi-temporal edges.
- **Letta**: an agent runtime with tiered memory.

Benchmarks (LoCoMo, LongMemEval, BEAM) are vendor-reported and conflict. For a single user who wants portability, the robust choice is to own the canonical store. That means plain files or SQLite/Postgres with a vector extension and a graph layer, exposed via your own MCP memory server, with Notion and Google as projections rather than the source of truth.

### Cited Findings
- **Mem0** self-reports 92.5% on LoCoMo and 94.4% on LongMemEval (Apr 2026). An independent LongMemEval run measured Mem0 at 49.0% vs Zep at 63.8% (GPT-4o). These conflict and are not reconciled. — [vectorize.io Mem0 vs Zep](https://vectorize.io/articles/mem0-vs-zep); [atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/)
- Benchmarks have converged on LoCoMo, LongMemEval and BEAM. Sources recommend evaluating on your own workload. — [atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/); [agenticwire](https://www.agenticwire.news/article/mem0-zep-letta-agent-memory)
- **Pricing:**
  - Mem0: free up to 10k memories, then $19/$79/$249 per month.
  - Letta: free self-host, $20/mo Pro.
  - Zep Flex: $125/mo (Jul 2026).
  
  Cloudflare also has an agent-memory offering. — [ecorpit comparison](https://ecorpit.com/ai-agent-memory-mem0-zep-letta-cloudflare-comparison-2026/); [developersdigest](https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026)
- Notion offers "Notion Memory" via its MCP: an About page plus a Memories database usable across agent clients. — observed in the Notion MCP server instructions in this environment (no public URL retrieved; UNVERIFIED externally)

### Inferences
- **Recommended memory layering:**
  - **L0, raw event log.** Append-only and encrypted: transcripts, captures, locations, shoot metadata.
  - **L1, episodic summaries.** Daily and per-project.
  - **L2, semantic facts and preferences.** Mem0-style extraction.
  - **L3, temporal entity graph.** Graphiti-style, for people, places, gear, projects and clients, with valid-from/valid-to so "current address" and "current rig" don't go stale.
  - **L4, procedural memory.** Skills, checklists, house style.
- **Run it local-first.**
  - SQLite with sqlite-vec, or Postgres with pgvector, on both the VPS and the laptop, synced via CRDT or log replication. This is an architectural suggestion; specific sync tooling was not researched.
  - Graphiti self-hosted, rather than Zep Cloud, keeps data under user control.
- **Portability.** Expose memory exclusively through one MCP server, using resources plus tools like `memory.search`, `memory.write` and `memory.forget`. Any client (Claude, OpenClaw, Gemini via MCP) can then use it, and the backend can be swapped.
- **Treat memory writes from untrusted content** (emails, web pages, OCR from glasses) as tainted. Store their provenance and never let them become instructions. See section 6.

### Gaps
- Solid / personal data store (PDS) 2026 status and any memory-portability standard (e.g., an MCP memory extension or AAIF working group) were not researched for lack of budget.
- No neutral 2026 head-to-head benchmark was found.
- Current Graphiti and Letta version numbers were not retrieved.

---

## 6. Security & privacy: prompt injection, least privilege, approvals, secrets, GDPR/AI Act, on-device models

### Takeaway
Prompt injection remains unsolved at the model level. The defensible posture is architectural:
- Never combine Willison's "lethal trifecta" (private data + untrusted content + exfiltration channel) in one context.
- Use CaMeL-style planner/quarantine separation with capability-tagged data flow.
- Require human approval for irreversible actions.

Regulation is moving against always-on glasses cameras:
- The **EDPB** adopted a smart-glasses statement in Oct 2026 placing bystander-information duties on vendors.
- **CNIL** issued an alert in May 2026.
- **AI Act** high-risk obligations are being deferred to Dec 2027 / Aug 2028 via the Digital Omnibus.

On-device models (Gemma 4 E2B/E4B, Apple Foundation Models) make offline triage feasible.

### Cited Findings
- **Lethal trifecta** (Willison, 16 Jun 2025): access to private data, exposure to untrusted content, and ability to externally communicate. "The LLM vendors are not going to save us." He documents exploits across M365 Copilot, GitHub MCP, GitLab Duo, ChatGPT, NotebookLM, Amazon Q, Slack, Grok, Le Chat and the Claude iOS app. — [Simon Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/); [aiweekly summary](https://aiweekly.co/alerts/willison-names-lethal-trifecta-behind-ai-agent-data-leaks)
- Willison also covered Meta's "Agents Rule of Two" and "The Attacker Moves Second" (Nov 2025). — [Willison MCP tag index](https://feeds.simonwillison.net/random/model-context-protocol/)
- **CaMeL** ("Defeating Prompt Injections by Design", arXiv 2503.18813, Google DeepMind et al., 24 Mar 2025; v2 June 2025).
  - A privileged LLM plans from the trusted user query.
  - A quarantined LLM parses untrusted data with no tool access.
  - A custom interpreter tracks provenance (capabilities) and enforces policies before each tool call.
  - No model changes are required.
  - Results: v1 solved 67% of AgentDojo tasks with provable security. A later version reports 77% vs 84% undefended. The authors note it does not address every attack vector.
  - Code: github.com/google-research/camel-prompt-injection.
  
  — [arXiv PDF](https://arxiv.org/pdf/2503.18813); [SOTAVerified](https://sotaverified.org/papers/defeating-prompt-injections-by-design); [MIT 6.858 2026 reading](https://css.csail.mit.edu/6.858/2026/readings/camel.pdf); [Willison on CaMeL, Apr 2025](https://simonwillison.net/2025/Apr/11/camel/)
- MCP 2026-07-28 hardens OAuth: RFC 9207 issuer validation, issuer-bound credentials, and CIMD over DCR. — [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- The OpenClaw incidents show that skill and plugin marketplaces are a live supply-chain vector (infostealers disguised as Notion and Gmail integrations). — [Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/)
- Anthropic warns, about Dispatch, that "mistakes (or malicious content the model encounters along the way) can have real consequences". — [Claude Dispatch docs](https://claude.com/docs/cowork/guide/dispatch)
- **EDPB smart-glasses statement** (13 or 14 Oct 2026; date conflicts).
  - Preliminary GDPR guidance highlighting covert recording of bystanders, particularly in hospitals, schools and workplaces.
  - Places the burden of informing bystanders on device makers and AI-service operators, not wearers.
  - Says current recording indicators leave many bystanders unaware.
  
  — [LexisNexis LNB News 14/10/2026](https://www.lexisnexis.co.uk/legal/news/edpb-adopts-statement-on-data-protection-implications-of-smart-glasses); [PPC Land](https://ppc.land/edpb-says-smart-glasses-makers-cant-rely-on-wearers-to-meet-gdpr-duties/)
- **CNIL alert** (11 May 2026): "vigilance" over connected glasses, with a "significant risk" of normalizing "almost invisible and omnipresent" surveillance. — [PPC Land](https://ppc.land/edpb-says-smart-glasses-makers-cant-rely-on-wearers-to-meet-gdpr-duties/); [gdprlocal (commercial)](https://gdprlocal.com/smart-glasses-and-gdpr/)
- **EU AI Act Digital Omnibus.**
  - Provisional agreement (June 2026) defers Annex III standalone high-risk obligations to 2 Dec 2027, and Annex I embedded-product obligations to 2 Aug 2028.
  - Adds an Article 5 ban on AI nudifiers and CSAM.
  - Takes effect only on Official Journal publication, which was targeted before 2 Aug 2026. Current adoption status is unconfirmed.
  
  — [Sidley Data Matters, 22 Jun 2026](https://datamatters.sidley.com/2026/06/22/eu-lawmakers-reach-provisional-agreement-to-delay-key-eu-ai-act-obligations/); [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/); [CMS](https://cms.law/en/gbr/publication/The-EU-s-Digital-Omnibus-on-AI-What-the-Provisional-Agreement-Really-Changes); [OneTrust](https://www.onetrust.com/blog/eu-digital-omnibus-proposes-delay-of-ai-compliance-deadlines/)
- **Gemma 4** (Google DeepMind, 2 Apr 2026, Apache 2.0).
  - Edge variants E2B/E4B target phones and laptops. Larger sizes are 26B MoE and 31B dense. A 12B tier was reportedly added 3 Jun 2026 (UNVERIFIED).
  - Runs fully on-device via the AI Edge Gallery app.
  
  — [InfoQ](https://infoq.com/news/2026/04/gemma-4-android-ai-inference); [NYU Shanghai RITS](https://rits.shanghai.nyu.edu/ai/google-releases-gemma-4-frontier-open-models-under-apache-2-0/); [letsdatascience](https://letsdatascience.com/news/google-runs-gemma-4-fully-offline-on-phones-8cd5ef39); [codersera](https://codersera.com/blog/gemma-3-vs-gemma-3n-a-comprehensive-comparison/amp/)

### Inferences
- **Policy layer design (CaMeL-lite, practical):**
  1. A planner agent sees only the user's request plus trusted memory and emits a typed plan.
  2. A reader/quarantine agent processes email, web and OCR content, and returns only schema-validated values. It has no tools.
  3. A deterministic policy engine (OPA/Cedar-style rules) tags data with provenance and blocks flows like "untrusted-derived value → send_email.to". Specific engines were not researched.
  4. Approval gates (push to phone or watch, approve on glasses) for irreversible actions: send, pay, delete, publish, share externally, calendar invites to others.
  5. Rate limits and spend caps.
- **Least privilege:**
  - Separate OAuth clients per capability: read-only Gmail for triage, drafts-only for compose.
  - Short-lived tokens. Per-tool MCP scopes.
  - No skill marketplaces. Pin MCP servers by hash.
- **Secrets:** keep them in a secrets manager or the OS keychain on each node, never in agent context or memory. Use separate credentials per node so a stolen laptop can be revoked alone. Full-disk encryption plus encrypted, end-to-end synced memory. This is architectural practice, not researched for 2026 products.
- **Bystander privacy (EU travel):**
  - Default glasses camera off. Capture only on explicit gesture.
  - No continuous video. Audio-only "record" requires explicit start.
  - Process faces out or blur on device. Never build face recognition of bystanders.
  - The EDPB statement suggests vendor-side duties, but a filmmaker also has creative-work GDPR considerations.
  - Camera-less Even G2 is the lowest-friction choice for EU daily wear.
- **Offline models:**
  - Run Gemma 4 E4B (or a similar Qwen/Llama small model) on the laptop and phone for triage, summarization, transcription post-processing and intent routing while offline.
  - Defer heavy reasoning to Claude when back online.
  - Apple Foundation Models is available on-device on Apple Intelligence hardware (not re-verified for iOS 27).

### Gaps
- The full EDPB statement text was not retrieved, and its exact adoption date conflicts.
- Official Journal publication of the AI Act Omnibus was not confirmed.
- Apple Foundation Models 2026 (iOS 27/macOS 27) on-device model size and offline guarantees were not researched. Qwen 3.x/3.5 and Llama small-model 2026 releases were not researched.
- No 2026 primary-source update from Willison was retrieved (fetch failed). Meta's "Rule of Two" details are from the index only.

---

## 7. Ambient/calm design and lessons from failed AI hardware

### Takeaway
Calm Technology (Weiser & Brown, 1995; Amber Case's eight principles, 2015/2016) says to use the periphery, require minimal attention, and work when it fails. Interruption research (Gloria Mark) shows that recovery after interruption is expensive (the "23 minutes" figure is approximate). Standalone AI gadgets largely failed or were absorbed:
- **Humane**: Pin discontinued, team sold to HP for $116M.
- **Limitless**: acqui-hired by Meta, $99 pendant halted.
- **Bee**: acquired by Amazon.

Value accrued to platforms that own the phone and glasses, not to single-purpose devices.

### Cited Findings
- "Calm computing" and calm technology were coined in 1995 by PARC's Mark Weiser and John Seely Brown. — [Amber Case: Principles of Calm Technology](https://www.caseorganic.com/post/principles-of-calm-technology)
- Case's principles include:
  - Require the smallest possible amount of attention.
  - Make use of the periphery.
  - Work even when it fails.
  - Respect social norms.
  - Use minimal technology.
  - Introduce features slowly.
  
  — [O'Reilly: "We are not bad at technology – technology is bad at us"](https://oreilly.com/content/principles-calm-technology-we-are-not-bad-at-technology-technology-is-bad-at-us); [O'Reilly book page](https://oreilly.com/library/view/~/9781491925874); [Case site](https://www.caseorganic.com/post/principles-of-calm-technology)
- Gloria Mark's research is cited as "over 23 minutes" to fully regain focus after an interruption. The precise "23 min 15 s" traces to her later work rather than the CHI papers. She notes that self-interruptions nearly equal external ones. — [UCI Informatics](https://www.informatics.uci.edu/forbes-brain-based-tips-for-sharpening-your-focus-gloria-mark-cited); [Gallup Q&A](https://news.gallup.com/businessjournal/23146/too-many-interruptions-work.aspx); [toolsforhumans critique](https://www.toolsforhumans.ai/blog/the-47-second-attention-crisis-what-the-research-actually-says-and-doesnt)
- **Limitless.** Meta acqui-hired it. The $99 pendant stopped selling, existing customers get a year of support, the Rewind desktop app is wound down, and the team moved to Reality Labs. — [ChannelNews](https://www.channelnews.com.au/meta-acquires-limitless-to-expand-ai-wearables-portfolio/); [Sacra](https://sacra.com/research/why-meta-bought-limitless/)
- **Bee.** Amazon agreed to buy the maker of the Pioneer wrist recorder/transcriber. Terms are undisclosed and product fate is unconfirmed. — [Tom's Guide](https://www.tomsguide.com/ai/amazon-buys-wearable-ai-startup-bee-a-wrist-device-that-hears-and-transcribes-every-word-you-speak)
- **Humane.** HP bought its software, IP, patents and team in Feb 2025 for $116M (86% below peak valuation) to form HP IQ. The AI Pin was discontinued. It had problems with slow responses and heat, and the charge case was recalled for battery fire risk. — [Sacra/ search summary](https://sacra.com/research/why-meta-bought-limitless/)

### Inferences
- **Why these devices failed:**
  - Latency, plus cloud dependence that is bad for travel.
  - A new attention surface competing with the phone.
  - Social unacceptability of always-recording.
  - Battery and heat.
  - No ecosystem or actuation (they could hear but not do).
  
  Lesson: piggyback on surfaces the user already wears (phone, watch, earbuds, mainstream glasses) and make the agent's value the actuation plus memory, not the gadget. This is partly inference; Rabbit, Friend and Plaud outcomes were not verified.
- **Delivery policy for "quiet but proactive":**
  - Classify every agent output into one of four tiers:
    1. Silent, written to the log/digest.
    2. Ambient, as a glance on the watch or glasses HUD with no sound.
    3. Batched, delivered as 1–3 daily digests aligned to natural breakpoints (morning, post-shoot, evening).
    4. Interruptive, only for time-critical items with a real deadline under 1 h, such as a flight gate change or a client blocking an edit.
  - Use attention signals: calendar, phone Focus mode, "Resolve is foreground + timeline playing" means do-not-disturb, and travel state from location velocity.
  - Track an interruption budget, e.g., at most N interruptive pings per day, with an expected-value-of-information threshold. This frames each ping as a cost-benefit decision under uncertainty.

### Gaps
- Rabbit R1, Friend pendant and Plaud outcomes in 2025–2026: the search returned irrelevant results.
- No 2025–2026 empirical research on AI-agent notification batching or attention-aware delivery was found in the time available. Iqbal & Horvitz's notification work was not retrieved.

---

## 8. Reference layered architecture (synthesis)

### Takeaway
A five-layer system with one always-on hub (EU VPS), intermittently connected edges (laptop, phone), and thin I/O peripherals (glasses, watch, earbuds). MCP 2026-07-28 is the universal tool bus, a durable job engine provides 24/7 reliability, a CaMeL-style policy layer provides safety, and a user-owned memory store sits behind one MCP server. Everything degrades to local-only operation offline.

### Cited Findings (building blocks, cited above)
- MCP stateless core, the Tasks extension and CIMD auth are the integration substrate. — [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- A2A v1.0 with Signed Agent Cards is for external agent federation. — [LF press](https://linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)
- Glasses SDKs are phone-hosted: Meta DAT, Even Hub. — [Meta DAT](https://wearables.developer.meta.com/docs/develop/dat/build-overview/); [Even Hub](https://hub.evenrealities.com/docs/getting-started/architecture)
- Phone OS agents use typed app functions: AppFunctions/Android MCP and App Intents. — [Android 17](https://android-developers.googleblog.com/2026/06/Android-17.html); [TechTimes](https://www.techtimes.com/articles/318005/20260608/wwdc-2026-app-intents-replaces-sirikit-gemini-siri-migration-clock-starts.htm)
- Heartbeat vs cron semantics (from OpenClaw) and cloud routines (Claude Code). — [OpenClaw automation](https://docs.openclaw.ai/automation); [The Register](https://www.theregister.com/2026/04/14/claude_code_routines/)
- CaMeL separation and the lethal trifecta. — [arXiv 2503.18813](https://arxiv.org/pdf/2503.18813); [Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- Durable execution engines. — [noqta](https://www.noqta.tn/blog/durable-execution-ai-agents-inngest-trigger-temporal-2026)

### Inferences (proposed architecture)

**L1: Sensors / edge capture**
- **Glasses.**
  - Meta Ray-Ban Display via DAT: camera on gesture, HUD.
  - Or Even G2 via Even Hub: HUD/teleprompter, with the R1 ring as input.
  - Glasses never run logic. They emit events to the phone edge app.
- **Phone edge app.**
  - Captures voice notes, location, photos, App Intents/AppFunctions entry points, and push receipt.
  - Runs a small on-device model (Gemma 4 E2B/E4B or Apple FM) for wake/intent classification and PII redaction.
  - Keeps a local outbox (SQLite) for offline store-and-forward.
- **Laptop edge node.**
  - A local MCP server exposing Resolve (DaVinci Resolve scripting API) and Remotion render jobs, the local media index, and the local memory replica.
  - Larger local model for offline reasoning.
  - Sync agent.
- **Watch/earbuds.** Notification and approval surface (tap to approve or deny), plus voice capture.

**L2: Event bus + sync**
- A canonical append-only event log with a CloudEvents-style envelope: `{id (uuid7), source_node, type, ts, provenance: trusted|untrusted, payload_ref}`.
- Each node has a local log that replicates to the hub over Tailscale/WireGuard when online. Use idempotent, monotonic per-node sequence numbers and conflict-free merge (an append-only log avoids most CRDT pain).
- Large media never transits. Only metadata and proxies do, with bandwidth-aware policies: on Starlink, hotel Wi-Fi or a metered eSIM, sync text only.

**L3: Orchestrator / agents** (hub: EU VPS; secondary: Claude routines)
- A durable workflow engine (Temporal, Inngest, or Postgres + a job queue) owns schedules, retries, idempotency keys and dead-letter queues.
- Agent roles:
  - **Triage**, on heartbeat every 30 min: cheap model; summarizes new events into digest candidates.
  - **Planner (P-LLM)**: Claude; trusted context only.
  - **Readers (Q-LLM)**: parse email, web and OCR into typed values; no tools.
  - **Executors**: call MCP tools under policy.
  - **Producer agent**: shoot logistics, call sheets, footage ingest checklists.
- OpenClaw is optional, as a chat front-end over Telegram/WhatsApp/Signal. If used, it is sandboxed, has no ClawHub skills, and is localhost-bound behind Tailscale.
- Reliability:
  - Each node pings an external dead-man's switch. The hub also pings one.
  - Missed pings alert via an independent channel (SMS or email), not via the agent.

**L4: Memory** (user-owned)
- Canonical store is Postgres + pgvector + Graphiti (temporal graph) on the hub, with a SQLite + vector replica on the laptop and phone (subset).
- Tiers: raw log, then episodic, then semantic facts, then a temporal entity graph, then procedural skills.
- Exposed only via one "memory" MCP server (`search`, `write` with provenance, `forget`, `export`).
- Notion and Google Docs are human-facing projections (dashboards, project pages), written by the agent and not trusted as instructions.
- Export is plain JSON/Markdown + SQL dump, giving portability across vendors.

**L5: Policy / permission layer** (cross-cuts L3 to L6)
- Capability/provenance tagging on all data. A deterministic policy engine checks every tool call. Lethal-trifecta rule: no single execution context gets untrusted input, private data and an egress tool together.
- Action risk classes:
  - **R0**: read-only, auto.
  - **R1**: reversible writes such as drafts and labels; auto with log.
  - **R2**: external-facing (send, share, post, invite); needs one-tap approval on watch, phone or glasses.
  - **R3**: irreversible or financial (pay, delete, publish, sign); explicit approval with a summary diff plus a cooling-off option.
- Per-tool OAuth scopes, short-lived tokens, and a secrets vault per node. Pinned MCP servers. No marketplace skills.
- Bystander-privacy policy:
  - Camera capture requires an explicit gesture.
  - No continuous recording.
  - Location-aware stricter rules (EU, hospitals, schools).
  - Auto-delete raw captures after N days unless promoted.

**L6: Delivery surfaces** (calm delivery)
- An attention router picks the surface and timing from:
  - Context: Focus mode, Resolve playback, driving or flying, local time zone.
  - Urgency × confidence.
  - The daily interruption budget.
- Mapping:
  - HUD glance (glasses) or watch haptic for ambient items.
  - Push notification for time-critical items.
  - Morning and evening digests for everything else, written to a Notion page plus a push summary.
- Every proactive message carries a reason ("because flight LH123 moved 40 min") and a one-tap "don't tell me about this kind of thing" control that feeds back into policy.

**Offline mode (the nomad case)**
- Phone and laptop keep working with local models plus the local memory replica.
- Actions queue in the outbox, and R2/R3 actions queue for approval on reconnect.
- The hub continues scheduled jobs regardless. On reconnect, the digest summarizes what happened.
- Claude Code routines act as a secondary cloud scheduler if the VPS is down (subject to plan caps).

### Gaps
- No concrete 2026 product for CRDT/log sync across phone, laptop and VPS was researched (e.g., Electric, PowerSync, Automerge, Litestream).
- No verified DaVinci Resolve or Remotion MCP servers were researched.
- Watch-platform (watchOS / Wear OS 2026) agent and approval APIs were not researched.
- The cost model (LLM tokens per day for heartbeat triage vs digests) was not computed.
