# Content- & Keyword-Plan: micharoessler.com + Formatschnitt

Stand: 28.10.2026 · Recherche ohne Ahrefs/Semrush/Keyword Planner · Rohdaten: `/tmp/claude-0/-home-user/652f2655-ce0c-54db-a0a9-31d7547bb535/scratchpad/seo/raw/`

---

## 0. Methode, Datenqualität, Blocker (zuerst lesen)

**Was tatsächlich gemessen wurde**
- **Google Autocomplete** (`suggestqueries.google.com`, `hl=de&gl=de` bzw. `hl=en&gl=us`), ca. 230 Seeds. Rohdaten liegen in `raw/*.txt`. Autocomplete zeigt, *ob* und *wie vielfältig* gesucht wird, aber **kein Volumen**.
- **SERP-/Wettbewerbs-Checks** über das WebSearch-Tool (~35 Abfragen). **Wichtig:** Das Tool sucht von den USA aus. Die DE-„Rankings“ sind deshalb eine Annäherung an google.de, keine echte DE-SERP. Direktes Abfragen von Google, Bing oder DuckDuckGo war in dieser Umgebung blockiert.
- **Google Trends:** HTTP 429, also nicht nutzbar. **Semrush-Free-Checker:** nur per JS, keine Daten. Ein Ahrefs-Connector ist in dieser Umgebung zwar konfiguriert (plugin:marketing:ahrefs), aber **nicht autorisiert**.
- **ChatGPT, Perplexity und AI Overviews konnte ich nicht direkt abfragen.** Die GEO-Tests liefen über WebSearch, eine LLM-zusammengefasste Websuche. Der Mechanismus ist ähnlich (Retrieval und Zitat), aber nicht identisch.

**Wie die Volumen-Schätzungen entstehen** (alle Volumen in diesem Dokument sind *Schätzung*, Suchen/Monat im Zielmarkt DE bzw. US)

| Autocomplete-Befund | Schätzbereich |
|---|---|
| A0 – keine Vervollständigung, nicht einmal die exakte Phrase | 0–20 |
| A1 – nur die exakte Phrase kommt zurück | 10–70 |
| A2 – exakte Phrase + 2–5 sinnvolle Modifier | 30–200 |
| A3 – Kopfbegriff mit 8–10 Modifiern (inkl. kommerzieller) | 200–2.000+ |
| +1 Stufe, wenn der Begriff auch als Vervollständigung *anderer* Seeds auftaucht | |

Die Unsicherheit liegt bei etwa ±1 Größenordnung. Für die *Priorisierung* (relativ) reicht das, für Traffic-Prognosen nicht.
**Echte Zahlen liefert:** der Ahrefs-Connector (Keywords Explorer: Volumen, KD, SERP-Overview für DE) oder Semrush. Gratis und mit echten Daten geht es über Google Search Console, sobald die Seiten indexiert sind (Impressionen pro Query), und über den Google Ads Keyword Planner (gratis mit Ads-Konto, ohne Kampagne aber nur grobe Bänder).

**Blocker vor jedem Content (Formatschnitt)**
1. **Domain-Widerspruch.** Laut Brief liegt das Angebot unter `micharoessler.com/formatschnitt/`. Im Code steht etwas anderes: `systems/astro.config` hat `site: 'https://formatschnitt.de'`, canonical, hreflang und Schema zeigen auf formatschnitt.de, und `deploy/vps-deploy.sh` setzt `X-Robots-Tag: noindex` für jeden Host außer formatschnitt.de. Live-Stand: `micharoessler.com/formatschnitt/` liefert **404**, formatschnitt.de war aus dieser Umgebung nicht erreichbar. → **Micha muss entscheiden.** Meine Empfehlung ist der Unterordner auf micharoessler.com. Gründe: Beide Domains starten praktisch ohne Autorität, eine Domain bündelt Links und die Person-Entität, und der thematische Mix lässt sich über eine saubere IA abfedern. Bei Unterordner anpassen: `site`/`base`, canonical, hreflang, Sitemap, Schema-`@id`, die noindex-Logik im Deploy, `sameAs` im Adventure-Person-Schema (zeigt aktuell auf formatschnitt.de) und den Link auf der About-Seite.
2. **Markenname ohne Suchnachfrage und mit Kollision.** „Formatschnitt“ ist ein Holz- und Plattenbearbeitungsbegriff (die SERP zeigt HOMAG, Formatsäge). „Schnittsystem“ bedeutet Nähschnittmuster. „Video Editing Abo“, „Videoschnitt Abo“ und „Flatrate“ liefern A0. → Markenname behalten, aber Titles, H1 und H2 in **Suchsprache** formulieren: „YouTube-Videos schneiden lassen“, „Cutter für YouTube“, „Festpreis pro Folge“.
3. **Entität = null.** WebSearch kennt „Micha Rössler/Roessler“ nicht. Treffer gibt es nur für Namensvettern (Günter Rössler, Maike/Markus Rößler auf Crew United). Auch „Drivers Eye“ wird nicht mit ihm verknüpft. KI-Assistenten können ihn also derzeit weder empfehlen noch zitieren. → Abschnitt 5.

---

## 1. Keyword-Cluster

Legende: **Intent** T = transaktional, K = kommerziell-vergleichend, I = informativ, J = überwiegend Jobsuchende (Mischintent). **Schwierigkeit** ist aus der Art der rankenden Seiten abgeleitet: Marktplätze, Tools und Jobbörsen bedeuten hoch, schwache oder fachfremde Treffer bedeuten niedrig.

### 1A Formatschnitt – Deutsch (Primärmarkt)

**Cluster F-1: Dienstleistung / Kauf**

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| video schneiden lassen | DE | 200–800 (A3: ki, preise, professionell …) | T, viel KI-DIY | mittel-hoch (Tools/KI) | /formatschnitt/ (Home) |
| youtube videos schneiden lassen | DE | 50–200 (A1, aber Vervollständigung zweier Seeds) | T | mittel – SERP voller DIY-Tools (VEED, CapCut, EaseUS) → **Intent-Lücke** für echte Dienstleister | /formatschnitt/ (Home, Title/H1) |
| video professionell schneiden lassen | DE | 20–100 (A2-Ableitung) | T | niedrig-mittel | Home |
| cutter für youtube | DE | 100–500 (A3, ~50 % J: „werden“, „jobs“, „gehalt“) | T/J | mittel | Home + neu: /formatschnitt/cutter-fuer-youtube/ |
| cutter für youtube finden | DE | 10–50 (A2-Modifier) | K | niedrig | /formatschnitt/cutter-fuer-youtube/ |
| youtube cutter gesucht · cutter gesucht youtube | DE | 30–150 (A2) | J + Firmen | hoch (StepStone, remotely, join) | /formatschnitt/cutter-fuer-youtube/ (Winkel: „Alternative zur Stellenanzeige“) |
| videoschnitt agentur · video editing agentur | DE | je 10–70 (A1) | T | mittel (Agentur-Seiten, Jobs) | neu: /formatschnitt/videoschnitt-auslagern/ |
| videoschnitt service · videoschnitt freelancer | DE | je 10–70 (A1) | T | mittel-hoch (freelancermap, Fiverr) | /formatschnitt/videoschnitt-auslagern/ |
| video editor freelancer | DE | 100–400 (A3: fiverr, stundensatz, portfolio) | T/J | hoch (Fiverr, Malt) | – (nur über Profile, s. 5) |
| youtube agentur (+ Stadt) | DE | 200–1.000 (A3, Städte-Modifier) | T (Full-Service) | hoch; ein Solo-Editor passt nicht zum Intent | **nicht targeten** → Listung bei drweb.de-Vergleich |
| video podcast schneiden · podcast video schnitt | DE | 10–70 (A1 / A0) | T | niedrig-mittel (soundandgo.com, intotheminds) | neu: /formatschnitt/video-podcast-schneiden-lassen/ |
| podcast schneiden lassen | DE | 20–100 (A1) | T | mittel (soundandgo „ab 95 €/Folge“) | dito |
| reels / tiktok videos schneiden lassen | DE | je 10–50 (A1) | T | mittel | Abschnitt in Shorts-Ratgeber |
| video editing abo · videoschnitt abo/flatrate · videoschnitt outsourcen | DE | 0–20 (A0) | – | – | **kein SEO-Ziel**; Begriffe nur im Text erklären |

**Cluster F-2: Kosten / Vergleich (Kern für GEO)**

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| was kostet ein cutter für youtube videos | DE | 30–150 (Vervollständigung unter „cutter für youtube“ **und** „was kostet ein cutter“) | K | **niedrig**: Treffer sind CapCut-Ads-Seite, alleantworten.de, US-Blogs in USD | neu: /formatschnitt/was-kostet-ein-cutter/ |
| was kostet ein cutter pro stunde · cutter stundensatz · video cutter stundensatz | DE | 30–150 zusammen (A2) | K | niedrig-mittel | dito |
| videoschnitt kosten · … pro stunde | DE | 100–400 (A3, aber überlagert von „kostenlos“) | K | mittel (Vendor-Blogs, Software) | dito |
| videoschnitt preise · video schneiden lassen preise | DE | je 20–100 (A1/A2) | K | mittel | neu: /formatschnitt/preise/ |
| cutter gehalt (+ monat, netto, youtube) | DE | 500–2.000 (A3) | I/J | hoch (gehalt.de, StepStone, kununu) | Sekundär-KW in /formatschnitt/cutter-einstellen-oder-extern/ |
| gehalt cutter youtube | DE | 20–100 (Modifier) | I | mittel | dito |
| cutter einstellen · freelancer oder festanstellung | DE | 10–50 / 50–200 (generisch, IT-lastig) | K | mittel | dito |
| youtube kanal für unternehmen kosten · youtube für unternehmen kosten | DE | je 20–100 (A2-Modifier) | K/I | **niedrig**: lilys.ai-Notiz, kinsta (Creator), keine B2B-Antwort | neu: /formatschnitt/youtube-kanal-unternehmen-kosten/ |

**Cluster F-3: Format & Prozess (Top-Funnel, Autorität)**

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| youtube kanal für unternehmen · youtube für unternehmen | DE | 100–500 (A3) | I | mittel-hoch (Google-Hilfe, Kinsta, Agenturen) | Ratgeber Kosten (s. o.), intern verlinkt |
| youtube shorts für unternehmen | DE | 10–50 (Modifier) | I | niedrig-mittel | neu: /formatschnitt/shorts-aus-jeder-folge/ |
| shorts aus youtube video erstellen | DE | 20–100 (A1) | I (DIY) | hoch (KI-Clip-Tools) | dito (Nebenziel) |
| wie oft sollte man ein video hochladen youtube | DE | 30–150 (Modifier) | I | mittel | Absatz im Kosten-/Rhythmus-Ratgeber |
| youtube styleguide | DE | 10–50 (A1) | I | niedrig | neu: Vorlage „Format-Styleguide“ |
| youtube format (entwickeln) | DE | Kopf A3, aber **falscher Intent** (Pixel, Größe, „Formate wie 7 vs Wild“) | – | – | nicht targeten |

### 1B Formatschnitt – Englisch (Sekundärmarkt)

Ehrliche Einordnung: Die EN-SERPs werden von US- und Offshore-Abo-Agenturen dominiert (Vidpros $1.000/Monat unlimited, Video Chops $995 für 8–10 Videos, BeCreatives $899/$1.999, Clipmasters ab $897) sowie von Listicles (lickd, vidico, DesignRush, Clutch). Formatschnitt kostet 2.200 € für 4 Folgen und ist damit **teurer** als diese Anbieter. Ein Preisvergleich ist auf Englisch also nicht zu gewinnen. EN nur mit EU-Winkel und geringem Aufwand bespielen.

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| youtube video editing service(s) | EN | 500–2.000 (A3) | T | sehr hoch | – |
| youtube editor for hire | EN | 200–1.000 (A3, reddit/discord) | T | hoch | – |
| video editing subscription · unlimited video editing | EN | je 100–500 (A3) | T | hoch | – |
| how much does a youtube editor cost (per video) | EN | 200–800 (A3) | K | mittel-hoch (Vendor-Blogs) | neu: /formatschnitt/en/youtube-editor-cost-europe/ (EU/EUR-Winkel) |
| video editor monthly retainer · video editing retainer | EN | 20–100 (A2) | K/T | mittel | /formatschnitt/en/ (Home, H2) |
| in house video editor vs freelancer | EN | 0–20 (A0) | K | – | nur GEO (Abschnitt im Kosten-Artikel) |
| best b2b youtube channels | EN | 50–200 (A2) | I | mittel (Listicles) | optional, später |
| corporate youtube series · corporate youtube channel | EN | 20–100 (Modifier) | I | niedrig-mittel | optional |

### 1C micharoessler.com – Adventure (EN Default)

Ehrliche Einordnung: Die Käuferbegriffe sind **winzig**. Viele davon sind Jobsuche („adventure videographer jobs“, „expedition videographer job“) oder Career/Workshop („adventure filmmakers workshop banff“). Käufer (Outdoor-Marken, Expeditionsteams, Tourismus) finden Filmemacher vor allem über Empfehlung, Instagram, Festivals und Profile. SEO trägt hier vor allem **Auffindbarkeit über Profile und Entität** plus Long-Tail-Erfahrungsinhalte.

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| expedition filmmaker | EN | 30–150 (A2, aber Modifier sind Filme/Mariana Trench) | T/I | **niedrig-mittel**: Twine-/StaffMeUp-Profile, Explorers-Connect-Listing, Elia Saikaly | / (Home) + neu /services/expedition-filming/ |
| expedition filmmaker for hire | EN | 10–50 (Schätzung, A0 als Seed) | T | niedrig (nur Profile) | /services/expedition-filming/ |
| expedition videographer | EN | 20–100 (A2, „job“) | J/T | niedrig-mittel | dito |
| adventure filmmaker | EN | 100–300 (A3, Workshop/Jobs) | J/I | mittel | / (Home) |
| adventure videographer · outdoor videographer | EN | je 20–100 (A2, „jobs“) | J/T | niedrig-mittel | dito |
| documentary editor for hire | EN | 30–100 (Vervollständigung zweier Seeds) | T | mittel (Mandy, Upwork, Fiverr) | neu: /services/documentary-editing/ |
| freelance documentary editor · documentary editor rates | EN | 30–150 (A3-Modifier) | T/K | mittel | dito |
| outdoor film production (companies) · adventure film production companies | EN | 30–150 / 20–100 (A2) | T | mittel (Wild Films, Anthill, Origin, HelliVentures) | /services/expedition-filming/ |
| hotel video production (company) · luxury hotel video production | EN | 100–400 (A3) | T | hoch (weltweite Agenturen) | neu: /services/hotel-destination-films/ |
| tourism video production (company) | EN | 50–200 (A2) | T | mittel-hoch | dito |
| freelance camera operator day rate / rates | EN | 50–150 (A3-Modifier) | K | mittel | neu: /journal/expedition-filmmaker-cost/ |
| how much does it cost to hire a videographer | EN | 200–800 (Vervollständigung) | K | hoch (Beverly Boy, Thumbtack) | dito (Nebenziel) |
| documentary cinematographer for hire · high altitude cinematographer | EN | 0–20 (A0) | T | – | im Text verwenden, kein Hauptziel |
| brand documentary · outdoor brand film | EN | 50–200 (verseucht: „Russell Brand“) / 0–20 | K | mittel | neu: /journal/brief-an-expedition-film/ |

**Erfahrungs-Long-Tail (I, Autorität und Zitierbarkeit, kaum direkte Leads)**

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| bolivia drone laws · bolivia drone registration · drone bolivia | EN | 30–150 zusammen (A3-Modifier) | I | **niedrig**: uavcoach, drone-traveller widersprechen sich, keine Sajama-spezifische Quelle | neu: /journal/drone-filming-bolivia/ (*nur mit eigener Erfahrung*) |
| sajama national park (bolivia) | EN | 1.000–5.000 (A3) | I | hoch (Wikipedia, Reiseguides) – Long-Tail „filming/photography sajama“ realistisch | /work/bolivia-andes/ (ausbauen) |
| filming at high altitude · camera batteries cold | EN | 10–50 (A0/A1) | I | **niedrig**: Foren 2008–2015, alanarnette, NatGeo-Tipps | neu: /journal/filming-at-altitude/ |
| best camera for mountaineering | EN | 200–800 (A3, reddit) | I/K | hoch | dito (Nebenziel, eigenes Kit: A7S III/A7 IV) |
| kilimanjaro drone permit · drone kilimanjaro | EN | 50–200 (A3-Modifier) | I | mittel (Tour-Operator-Blogs) | nur wenn Micha dort tatsächlich eine Drohne nutzte – **nicht dokumentiert** |
| kilimanjaro rongai route (filming) | EN/DE | 50–200 (A2) | I | mittel-hoch (Operator) | /work/kilimanjaro/ (ausbauen) |
| lyngen alps ski touring · arctic circle trail | EN | 200–800 / 1.000–3.000 (A3) | I | hoch | erst nach den Touren 2027 |

### 1D micharoessler.com – Deutsch (/de/)

| Keyword | Spr. | Volumen (Schätzung, Basis) | Intent | Schwierigk. | Ziel-URL |
|---|---|---|---|---|---|
| expeditionsfilmer · outdoor filmemacher · bergfilmer · abenteuerfilm produktion · dokumentarfilmer buchen | DE | **0–20 je** (A0) | – | – | Title/H1 behalten (Entität), **kein Traffic erwarten** |
| kameramann buchen (+ kosten) | DE | 50–200 (A2) | T | mittel (lokal, Hochzeit) | /de/ (Home) + neu /de/leistungen/expedition-bergfilm/ |
| kameramann tagessatz · freier kameramann tagessatz · tagessatz kameramann mit equipment | DE | 50–200 zusammen (A2) | K | **niedrig-mittel**: WebSearch fand keine brauchbare DE-Antwort | neu: /de/journal/kameramann-tagessatz/ |
| kameramann kosten · kosten kameramann pro tag | DE | 50–200 (A3-Modifier, Hochzeit-lastig) | K | mittel | dito |
| imagefilm hotel · imagefilm hotels deutschland | DE | 20–100 (A2) | T | niedrig-mittel | neu: /de/leistungen/hotel-destinationsfilm/ |
| imagefilm tourismus | DE | 10–50 (Modifier) | T | niedrig | dito |
| imagefilm kosten | DE | 500–2.000 (A3) | K | hoch (Agenturen mit Rechnern) | nicht Hauptziel |
| dokumentarfilm schnitt | DE | 10–50 (A1) | T | niedrig | /de/leistungen/dokumentarfilm-schnitt/ |
| drohne bolivien · bolivien drohne fliegen | DE | 10–50 (A2) | I | niedrig | DE-Version des Bolivien-Drohnen-Artikels |
| kamera akku kälte · beste kamera bergsteigen | DE | 50–200 / 20–100 | I | mittel | DE-Version des Höhen-Artikels |
| 24h nürburgring doku | DE | 10–50 (A1) | N/I | niedrig | /de/work/drivers-eye-24h-nurburgring/ |

---

## 2. Wettbewerbsanalyse je Cluster

(SERP-Beobachtung über WebSearch, US-Standort. Für DE ist das eine Annäherung.)

### F-1 „YouTube-Videos schneiden lassen / Cutter für YouTube“ (DE)

| Wer rankt | Typ | Stärke | Lücke für Micha |
|---|---|---|---|
| veed.io, capcut.com, wayin.ai, submagic.co, EaseUS | Software/Tool | hohe DA, „schneiden“-Intent | Beantworten „selbst schneiden“, nicht „schneiden *lassen*“ → Dienstleistungs-Intent unbedient |
| StepStone, remotely.de, join.com, marketingmonk | Jobbörse | dominieren „Cutter gesucht“ | Firma mit Bedarf findet nur Stellenanzeigen → Seite „Alternative zur Stellenanzeige“ |
| freelancermap.de, de.fiverr.com | Marktplatz | Masse, Bewertungen | keine Prozess- oder Qualitätsgarantie, kein Festpreis pro Folge |
| soundandgo.com (Köln) | Podcast-Schnitt-Dienstleister | eigene LPs je Leistung, „ab 95 €/Folge“, Video-Podcast-Seite | Audio-Fokus; kein „System“-Winkel, keine Rechenbeispiele |
| intotheminds.com | Video-Podcast-Agentur | klares Versprechen („1 h Aufnahme → 1 Folge/Woche“) | Agentur, kein Direktkontakt |
| drweb.de „YouTube Agentur Vergleich 2026“ (38 Anbieter) | Verzeichnis/Listicle | wird für Agentur-Fragen zitiert | **Aufnahme beantragen** (Off-Site-Signal) |

### F-2 Kosten (DE)

| Wer rankt | Typ | Stärke | Lücke |
|---|---|---|---|
| tubeanalytics.net, c-istudios, vidico, moonb, adsnipper | US-Vendor-Blogs | strukturierte Preisspannen | **USD, US-Markt**, interessengeleitet; keine DE-Gehalts- oder Lohnnebenkosten |
| alleantworten.de, studenten365 | Q&A/Content-Farm | rankt mangels Alternative | dünn, unbelegt |
| lilys.ai (KI-Notiz) | KI-Content | „2.000–5.000 € pro Video“ | unbelegt, Dreh statt Schnitt |
| freelancermap-Blog, kofa.de, computerwoche | Freelancer- vs. Festanstellungs-Ratgeber | belastbare Lohnnebenkosten-Logik | nicht videospezifisch |
| gehalt.de, StepStone-Gehalt | Gehaltsportal | Cutter-Gehalt | keine Vollkosten-/Make-or-Buy-Rechnung |

→ **Größte Lücke des Projekts:** Eine deutsche, belegte, datierte Antwort auf „Was kostet ein Cutter für YouTube / angestellt vs. extern“ existiert nicht. Micha hat die Quellen schon im `calc`-Block (gehalt.de 3.795 €, brutto-netto-gehaltsrechner.de 3.800 €, Lohnnebenkosten 20–25 % lt. lohnklar.de/factorialhr.de).

### F-EN (Formatschnitt EN)

| Wer | Typ | Stärke | Lücke |
|---|---|---|---|
| Vidpros, Video Chops, BeCreatives, Clipmasters, Tasty Edits | US-/Offshore-Abo-Agenturen | Preis ($900–2.000/Monat), Volumen | US-zentriert, „unlimited“ statt definiertem Standard, kein DACH/EU-Bezug |
| lickd.co, vidico, DesignRush, Clutch, advids | Listicles/Verzeichnisse | werden von KI zitiert | Pay-to-play; Profile möglich |
| A2 Media (B2B SaaS), Action Axis | B2B-Editing-Studios | B2B-Positionierung | Mindestbudget 10–25 k$ → Micha liegt darunter |

### A-1 Expedition/Adventure Filmmaker (EN)

| Wer rankt | Typ | Stärke | Lücke |
|---|---|---|---|
| Twine-, StaffMeUp-, Malt-, Behance-, Moment-, FilmFreeway-Profile | Profil-/Marktplatz-Seiten | Domain-Stärke, oft Tagessatz sichtbar (z. B. $600–1.800/Tag, €333/Tag) | Micha hat **kein einziges** Profil → reiner Profil-Aufbau bringt schnelle Sichtbarkeit |
| explorersconnect.com (Listing 03/2026) | Community-Listing | rankt für „expedition filmmaker for hire“ | Eintrag/Story pitchen |
| eliasaikaly.com, renanozturk.com | Persönliche Sites (Elite) | Everest, NatGeo, Awards | unerreichbar im Head; Micha konkurriert eine Liga darunter, im Segment „Solo-Crew, Doku + Social-Formate, DE/EN“ |
| Wild Films, Anthill, Origin, HelliVentures (München), We Are Explorers | Produktionsfirmen | Kundenlisten, Teams | teuer, Agentur-Overhead → Micha: „ein Ansprechpartner, der selbst trägt und schneidet“ (steht in seinem FAQ) |
| Beverly Boy (Kosten-Artikel) | US-Produktionsfirma, Content-SEO | dominiert „how much does it cost to hire a cameraman“ | nichts zu Expedition/Höhe; einzige Expeditionszahl ($1.000/Tag) stammt von einem Everest-Outfitter |

### A-2 Erfahrungs-Long-Tail (Drohne, Höhe, Kälte)

| Wer | Typ | Lücke |
|---|---|---|
| uavcoach, drone-traveller, mavicpilots-Forum | Drohnen-Guides/Foren | widersprüchlich zu Bolivien (keine Gesetze vs. Gesetz 2019, DGAC vs. ATT), nichts zu Sajama |
| altezzatravel, ultimatekilimanjaro | Tour-Operator | verkaufen Permits; Zahlen interessengeleitet |
| thephotoforum, dgrin, dvinfo, CML | alte Foren | veraltet (teils 2008–2015) → aktueller Erfahrungsbericht mit Sony A7S III hat gute Chancen, auch als KI-Quelle |

### A-DE

| Wer | Lücke |
|---|---|
| Bergwelten, bergsteigen.com, Festivals (EOFT, St. Anton, Tegernsee) | redaktionelle Porträts von Bergfilmern → **Pitch-Ziel**, keine Konkurrenz |
| Kameramann-Tagessatz: keine brauchbaren DE-Treffer (nur Gear-Listen) | klare Lücke |

---

## 3. Seitenplan (priorisiert)

Spalte „Wer füllt“: **C** = kann ich komplett vorbereiten (Recherche, Text, Schema), **C→M** = mein Entwurf, Micha ergänzt Erfahrung oder Zahlen und gibt frei, **M** = braucht Michas Material (Video, Fotos, Erlebnis).

### 3A Formatschnitt

| # | Titel (Arbeitstitel) | Ziel-Keyword | Outline (Kurz) | Interne Links | Wer füllt |
|---|---|---|---|---|---|
| F1 | **Was kostet ein Cutter für YouTube? Preise 2026 – Freelancer, Agentur, Angestellter** | was kostet ein cutter für youtube videos; cutter stundensatz; videoschnitt kosten | 1) Antwort in 3 Sätzen + Tabelle (Preismodelle Stunde/Video/Monat) · 2) DE-Gehalt + Lohnnebenkosten mit Quellen (calc-Daten) · 3) Internationale Spannen, klar als US-Vendor-Daten markiert · 4) Was den Preis treibt (Länge, Grafik, Revisionen, Shorts) · 5) Rechenbeispiel 4 Folgen/Monat inkl. Formatschnitt-Preis als *ein* Datenpunkt · 6) FAQ | → Rechner (#calc), F2, /preise/, Pilot-CTA | **C** (Micha: Freigabe) |
| F2 | **Cutter einstellen oder extern vergeben? Vollkosten-Rechnung für YouTube-Formate** | cutter gehalt; cutter einstellen; freelancer oder festanstellung | 1) Kurzantwort: ab wann sich was lohnt · 2) Vollkosten Angestellter (Gehalt, LNK 20–25 %, Arbeitsplatz, Recruiting, Ausfall) · 3) Freelancer: Verfügbarkeit, Qualitätsstreuung · 4) Festpreis-System · 5) Entscheidungsmatrix nach Folgen/Monat · 6) Rechner eingebettet | → F1, Home-Rechner, F4 | **C** |
| F3 | **Preise: Pilot, Setup, Folgen-Abo** (eigene URL /preise/) | videoschnitt preise; video schneiden lassen preise | 1) Preistabelle als HTML-Text (nicht nur Karten) · 2) Was ist drin/nicht drin · 3) Pro-Folge-Rechnung (550 €/≈490 €) · 4) Reverse-Charge/LLC-Hinweis · 5) FAQ · `Offer`-Schema mit `price`/`priceCurrency` | → F1, Pilot, Kontakt | **C** |
| F4 | **Cutter für YouTube gesucht? Die Alternative zur Stellenanzeige** | cutter gesucht youtube; youtube cutter gesucht; cutter für youtube finden | 1) Drei Wege: Stelle / Freelancer / System – Zeit bis zur ersten Folge · 2) Was eine Ausschreibung kostet (Recruiting-Kosten, Quelle als Vendor-Zahl markiert) · 3) Woran man einen guten Format-Cutter erkennt (Checkliste) · 4) Briefing-Mindestinhalt · 5) Pilot als Probezeit | → F2, F6, Home | **C** |
| F5 | **YouTube-Kanal für Unternehmen: Was kostet ein laufendes Format pro Monat?** | youtube kanal für unternehmen kosten; youtube für unternehmen kosten | 1) Kostenblöcke (Konzept, Dreh, Schnitt, Shorts, Thumbnails, Upload) · 2) 3 Budget-Szenarien (inhouse/hybrid/extern) · 3) Rhythmus: wie oft hochladen · 4) Was sich wiederholen muss, damit es skaliert · 5) FAQ | → F1, F7, Format-Check | **C** |
| F6 | **Vorlage: Format-Styleguide & Schnitt-Briefing für wiederkehrende YouTube-Folgen** (Download) | youtube styleguide; (GEO: „wie brieft man einen Cutter“) | 1) Warum ein Format „einmal entschieden“ wird · 2) Vorlage: Aufbau, Look, Titel, Grafiken, Shorts-Regeln · 3) Feedback als *eine* Liste – Beispiel · 4) Ausgefülltes Beispiel (fiktiv, als solches markiert) · 5) Download | → Setup-Paket, F4 | **C→M** (Micha: echte Praxisregeln) |
| F7 | **Shorts aus jeder Folge: Ein fester Ablauf statt Zufallsclips** | youtube shorts für unternehmen; shorts aus youtube video erstellen; reels schneiden lassen | 1) Warum 3 Shorts pro Folge · 2) Auswahlkriterien (Hook, Eigenständigkeit) · 3) Hochkant-Regeln · 4) KI-Clip-Tools vs. Redaktion – ehrlich · 5) Beispiel-Workflow | → F3, Home | **C→M** (Micha: Beispiele aus eigener Arbeit) |
| F8 | **Video-Podcast schneiden lassen – Folge + Shorts zum Festpreis** | video podcast schneiden; podcast schneiden lassen; podcast schnitt kosten | 1) Für wen (wiederkehrender Talk/Interview) · 2) Ablauf · 3) Preise pro Folge · 4) Abgrenzung zu Audio-Schnitt · 5) FAQ | → F3, F7 | **C**, *aber Micha muss bestätigen, dass er Podcasts annimmt* |
| F9 | **Fallstudie: Review-Serie für Carwow Deutschland (2025)** | Brand + E-E-A-T (kein Volumen) | 1) Ausgangslage · 2) Was als Standard festgelegt wurde · 3) Ablauf pro Folge · 4) Ergebnis (nur freigegebene Fakten/Zahlen) · 5) Was andere Formate daraus lernen | → Home-Proof, F6 | **M** (Freigabe Carwow nötig; keine erfundenen Zahlen) |
| F10 | **Videoschnitt auslagern: Freelancer, Agentur oder Festpreis-System im Vergleich** | videoschnitt agentur; video editing agentur; videoschnitt outsourcen | 1) Vergleichstabelle (Kosten, Steuerung, Konstanz, Risiko) · 2) Wann welche Option · 3) Marktplätze ehrlich bewertet · 4) Vertragspunkte (Revisionen, Rechte, Rohmaterial) · 5) FAQ | → F1, F2, F3 | **C** |
| F11 (EN) | **How much does a YouTube editor cost in Europe? Freelance vs in-house vs retainer** | how much does a youtube editor cost; in house video editor vs freelancer; video editing retainer | 1) Answer-first table in EUR · 2) German/EU salary + on-costs (sourced) · 3) Why US "unlimited" plans differ · 4) Retainer maths · 5) FAQ | → /en/, EN pricing | **C** |
| F12 (EN) | /en/ Home: H2 „Monthly video editing retainer for company YouTube shows“ | video editor monthly retainer | Title/H2-Anpassung, kein neuer Artikel | – | **C** |

### 3B micharoessler.com (EN + DE)

| # | Titel (Arbeitstitel) | Ziel-Keyword | Outline (Kurz) | Interne Links | Wer füllt |
|---|---|---|---|---|---|
| A1 | **Documentary Editing – story-first edits for long-form docs** (/services/documentary-editing/ + DE /de/leistungen/dokumentarfilm-schnitt/) | documentary editor for hire; freelance documentary editor; dokumentarfilm schnitt | 1) Was ich schneide (Langform, Cut-downs) · 2) Belege: Drivers Eye 1,4 Mio., Hotrodtour 1,2 Mio. (mit Embeds) · 3) Remote-Ablauf & Lieferformate · 4) Zusammenarbeit (direkt, DE/EN, LLC) · 5) FAQ | → /work/drivers-eye…, /work/hotrodtour…, Contact, Formatschnitt (für Serien) | **C** (aus vorhandenen Fakten) |
| A2 | **Expedition Filming – a one-person crew that keeps up** (/services/expedition-filming/ + DE /de/leistungen/expedition-bergfilm/) | expedition filmmaker (for hire); expedition videographer; outdoor film production; kameramann buchen | 1) Was du bekommst (Doku-Material + 9:16 + Stills, Bolivien-Beispiel) · 2) Planung um das Ziel (Höhe, Gewicht, Akkus) · 3) Kit (A7S III/A7 IV, Drohne, FPV) · 4) Genehmigungen/Drohne/Versicherung · 5) Referenzen Bolivien, Kilimandscharo, Sahara · 6) FAQ | → /work/bolivia-andes, /work/kilimanjaro, A4, A5 | **C→M** (Micha: Planungsrealität, ggf. Ausschnitte) |
| A3 | **Hotel & Destination Films** (/services/hotel-destination-films/ + DE /de/leistungen/hotel-destinationsfilm/) | hotel video production; tourism video production; imagefilm hotel | 1) Ort verkaufen über Menschen + Landschaft · 2) Bleibe-Beispiel (16:9 + 9:16, Drohne/Boden) · 3) Drehplan Sonnenaufgang–Dämmerung · 4) Lieferpaket Web + Social · 5) FAQ | → /work/bleibe…, Contact | **C→M** (Micha: Bleibe-Clips, Freigabe) |
| A4 | **Laponia midwinter ski traverse (Feb 2027): filming plan & brand partnership** | laponia ski traverse; (Sales-Asset für Markenpartner) | 1) Route & Ziel · 2) Was gefilmt wird, Formate · 3) Kälte-Logistik (Akkus, Kondensat) · 4) Partnerschaftsmodell (wie bei Hydraid: Film + Reels + Stills) · 5) Kontakt | → A2, A5, /work/bolivia-andes | **M** (Plan, Route, was er anbietet) |
| A5 | **Filming at altitude: what changes above 4,000 m** (+ DE „Filmen in der Höhe: Akkus, Kälte, Kondensat“) | filming at high altitude; camera batteries cold; best camera for mountaineering; kamera akku kälte | 1) Körper & Tempo · 2) Akkus/Kälte (eigene Praxis) · 3) Kondensat/Zelt · 4) Kit-Gewicht (A7S III vs A7 IV) · 5) Drohne in dünner Luft · 6) Checkliste | → A2, /work/bolivia-andes, /work/kilimanjaro | **M** (eigene Erfahrung zwingend); **C** liefert Struktur, Recherche, Quellen |
| A6 | **Flying a drone in Bolivia: rules, permits and what I saw in the Sajama region** (+ DE) | bolivia drone laws; drone bolivia; drohne bolivien | 1) Rechtslage mit Quellen + Widersprüche (DGAC/ATT, Registrierung >250 g) · 2) Nationalpark/SERNAP · 3) Eigene Praxis (nur Belegtes) · 4) Höhe & Wind · 5) Disclaimer + Datum | → /work/bolivia-andes, A5 | **C→M** (Recherche C; Erfahrung M) |
| A7 | **How much does an expedition filmmaker cost?** (EN) / **Kameramann-Tagessatz 2026: was ein Outdoor-Dreh kostet** (DE) | freelance camera operator day rate; kameramann tagessatz; tagessatz kameramann mit equipment | 1) Kurzantwort mit Spannen + Quellen · 2) Kostentreiber (Tage, Höhe, Kit, Drohnen-Permit, Versicherung, Reise) · 3) Post-Production separat · 4) Beispiel-Kalkulation · 5) Wie man brieft | → A2, Contact | **C** (Micha entscheidet, ob eigene Sätze genannt werden) |
| A8 | **Brand partner on an expedition: briefing a film that works in 16:9 and 9:16** | brand documentary; outdoor brand film | 1) Warum Doppelformat · 2) Hydraid-Brief als Beispiel (nur dokumentierte Fakten) · 3) Shot-Liste für zwei Formate · 4) Rechte/Stills · 5) Checkliste | → /work/bolivia-andes, A2, A4 | **C→M** (Hydraid-Freigabe prüfen) |
| A9 | Ausbau **/work/bolivia-andes/**: Sajama-Kontext, Drehtagebuch, Kapitel | sajama national park filming (Long-Tail) | Abschnitte: Region/Altiplano, Drehtage, Herausforderungen, Galerie-Captions, Status Doku | → A5, A6 | **M** |
| A10 | Ausbau **/work/kilimanjaro/**: Rongai mit Kamera, 7 Drehtage | kilimanjaro rongai route filming | Tagesetappen, Kit, was schiefging | → A5 | **M** |

Bewusst **nicht** geplant: Arctic Circle Trail/Lyngen-Erfahrungsartikel (erst nach Juli bzw. Februar 2027) und „imagefilm kosten“ (Agentur-Domäne, falscher Kunde).

---

## 4. Redaktionsplan Nov 2026 – Jan 2027 (13 Wochen)

Annahme: Micha hat etwa 3–5 h/Woche. Mein Anteil = Entwurf/Recherche/Schema. „Aufwand“ meint **Michas** Zeit.

| KW | Woche ab | Stück | Site | Ziel-Keyword | Format | Aufwand Micha | Wer |
|---|---|---|---|---|---|---|---|
| 45 | 02.11. | **Setup:** Domain-Entscheid Formatschnitt, Canonical/noindex fixen, GSC + Bing WMT für beide, Sitemaps einreichen | beide | – | Technik | 1 h (Entscheid + Konten) | C + M |
| 45 | 02.11. | F3 Preise-Seite + `Offer`-Schema | FS | videoschnitt preise | LP | 0,5 h Freigabe | C |
| 46 | 09.11. | F1 Was kostet ein Cutter für YouTube | FS | was kostet ein cutter für youtube videos | Ratgeber 1.800 W | 1 h | C |
| 46 | 09.11. | Profile: LinkedIn, Crew United, Vimeo (gleicher Bio-Text) | beide | Entität | Off-Site | 2 h | C (Texte) / M (Konten) |
| 47 | 16.11. | A1 Documentary Editing (EN+DE) | MR | documentary editor for hire | Service-LP | 1 h | C |
| 47 | 16.11. | Bitte an Felix v. d. Laden / Fabian Baggeler: Credit + Link in YouTube-Beschreibungen | MR | Entität | Outreach | 0,5 h | C (Mailentwurf) / M |
| 48 | 23.11. | F2 Cutter einstellen oder extern | FS | cutter gehalt / cutter einstellen | Ratgeber + Rechner | 1 h | C |
| 49 | 30.11. | A2 Expedition Filming (EN+DE) | MR | expedition filmmaker | Service-LP | 2 h | C→M |
| 49 | 30.11. | Profile: Explorers Connect, Malt, Twine, freelancermap | beide | Entität | Off-Site | 2 h | C / M |
| 50 | 07.12. | F4 Cutter gesucht? Alternative zur Stellenanzeige | FS | cutter gesucht youtube | Ratgeber | 1 h | C |
| 51 | 14.12. | A7 Expedition filmmaker cost / Kameramann-Tagessatz | MR | kameramann tagessatz | Ratgeber (EN+DE) | 1,5 h (Preis-Entscheid) | C |
| 52 | 21.12. | Puffer/Feiertage: GSC-Check der ersten Impressionen, Titles nachschärfen | beide | – | Pflege | 0,5 h | C |
| 01 | 28.12. | F5 YouTube-Kanal für Unternehmen: Kosten | FS | youtube kanal für unternehmen kosten | Ratgeber | 1 h | C |
| 02 | 04.01. | A4 Laponia-Filmplan + Partnersuche | MR | (Sales-Asset) | Projektseite | 3 h | M |
| 02 | 04.01. | drweb.de-Vergleich: Aufnahme anfragen | FS | youtube agentur (indirekt) | Off-Site | 0,5 h | C / M |
| 03 | 11.01. | F6 Vorlage Format-Styleguide & Briefing | FS | youtube styleguide | Vorlage/Download | 2 h | C→M |
| 03 | 11.01. | A5 Filming at altitude (EN+DE) | MR | filming at high altitude / kamera akku kälte | Erfahrungsartikel | 3 h | M |
| 04 | 18.01. | F7 Shorts aus jeder Folge | FS | youtube shorts für unternehmen | Ratgeber | 1,5 h | C→M |
| 04 | 18.01. | A3 Hotel & Destination Films (EN+DE) | MR | hotel video production / imagefilm hotel | Service-LP | 1,5 h | C→M |
| 05 | 25.01. | A6 Drohne in Bolivien (EN+DE) | MR | bolivia drone laws | Erfahrungsartikel | 2 h | C→M |
| 05 | 25.01. | F11 EN: YouTube editor cost in Europe | FS-EN | how much does a youtube editor cost | Ratgeber | 0,5 h | C |
| 06 | 01.02. | Review: GSC-Queries → Plan für Q2 (F8, F9, F10, A8–A10) | beide | – | Auswertung | 1 h | C |

Summe: 10 Formatschnitt-Stücke, 8 Adventure-Stücke plus Setup und Off-Site. Michas Zeit liegt bei etwa 35 h über 13 Wochen. **Q2-Rückstau:** F8 (erst Podcast-Entscheid), F9 (Carwow-Freigabe), F10, A8–A10.

**Nur Micha kann liefern:** A4, A5, A9, A10 (Erlebnis, Bilder, Clips), F9 (Freigabe/Zahlen), Preisentscheid für A7, Bestätigung von Podcasts (F8), Praxisregeln für F6/F7, Konten-Anlage für Profile.
**Kann ich vorbereiten:** F1–F5, F10, F11, A1, A7, Recherche-Teil von A6, Gliederungen und Fragenlisten (Interview-Fragebogen) für alle M-Stücke, Schema, Meta-Texte, Outreach-Mails, Profil-Bios.

---

## 5. GEO-Maßnahmen + Off-Site-Signale

### 5.1 Fragen, die Käufer KI-Assistenten stellen – und wer heute zitiert wird (WebSearch-Test)

| Frage (getestet) | Zitierte Quellen-Typen | Bewertung |
|---|---|---|
| Was kostet ein Cutter für YouTube pro Video/Monat? | US-Vendor-Blogs (tubeanalytics, c-istudios, vidico, moonb), CapCut, alleantworten.de, ein Stellenangebot | **Keine DE-Primärquelle** → F1/F2 können zur Standardquelle werden |
| Video Editing Abo / Festpreis Unternehmen? | contra.com, Upwork-Job, dribbble, moonb | Abo-Modell im DE-Raum unbelegt → F3 + F10 |
| Freelance vs in-house editor cost? | vidpros (Vendor), c-istudios, BLS-Zitat | „keine unabhängige Studie gefunden“ → F11 mit EU-Daten |
| Lohnt sich ein YouTube-Kanal für Unternehmen / Kosten pro Monat? | lilys.ai, kinsta, gofaceless | B2B-Antwort fehlt → F5 |
| Best expedition filmmakers for brand documentaries | Persönliche Sites (renanozturk.com), shootonline, adorama, base-films, explorersconnect | Entität + Profile + Presse nötig; Micha erscheint nicht |
| Expedition cinematographer day rate | beverlyboy (US-Produktion), Everest-Outfitter, dvxuser-Forum | einzige Expeditionszahl ist Marketing → A7 |
| Micha Rössler Filmemacher | nur Namensvettern | **Entität fehlt komplett** |

**Weitere Käuferfragen** (nicht einzeln getestet, aus Autocomplete und PAA-Logik abgeleitet): „Wie viele Stunden dauert der Schnitt einer YouTube-Folge?“, „Lohnt sich ein eigener Cutter bei 4 Videos im Monat?“, „Wie brieft man einen Cutter?“, „Was ist ein bezahlter Pilot beim Videoschnitt?“, „How do I film an expedition for a brand?“, „Can I fly a drone in Bolivia/on Kilimanjaro?“.

### 5.2 On-Site-GEO (priorisiert)
1. **Answer-first:** Jede Seite beginnt mit 2–3 Sätzen, die die Frage mit Zahl und Bedingung beantworten. Danach folgt eine Tabelle.
2. **Belegte, datierte Zahlen** mit „Stand: Monat Jahr“ und Quellenlinks. Michas calc-Quellen sind dafür ideal. Eigene Preise als HTML-Text, nicht nur in JS-Komponenten (Calculator/Format-Check sind clientseitig, also für Crawler schwach).
3. **Schema:** `Offer`/`PriceSpecification` an den Paketen, `FAQPage` (existiert auf Adventure-Home), `Article` mit `author` → `#person`, `VideoObject` (existiert für Projekte), `Service` je Leistungsseite. `sameAs` vervollständigen (LinkedIn, Vimeo, Crew United, YouTube).
4. **Byline + Autorenbox** auf jedem Ratgeber (Foto, 2 Sätze, Link About). Eine Person, zwei Angebote, gegenseitig verlinkt.
5. **robots.txt:** beide `Allow: /`, damit sind AI-Crawler nicht blockiert. Nur die Sitemap-URL der Formatschnitt-Seite an die Domain-Entscheidung anpassen. `llms.txt` ist optional und hat keinen belegten Effekt, deshalb niedrige Priorität.
6. **Konsistente Begriffe:** „Festpreis pro Folge“, „Pilot (950 €)“, „Setup (1.900 €)“, „Folgen-Abo S/M“ überall identisch. KI-Systeme übernehmen konsistente Fakten eher.

### 5.3 Off-Site-Entitätssignale (realistisch für Solo, priorisiert)

| Prio | Maßnahme | Warum | Aufwand |
|---|---|---|---|
| 1 | **Credits in YouTube-Beschreibungen** von Drivers Eye (1,4 Mio.) und Hotrodtour (1,2 Mio.) bei Felix von der Laden, dazu das Sahara-Video bei Fabian Baggeler: „Kamera & Schnitt: Micha Rössler – micharoessler.com“ | stärkste verfügbare Verknüpfung *Werk ↔ Person* auf einer großen, vertrauten Plattform | 1 Mail je Creator |
| 2 | **LinkedIn** (Person, Headline mit beiden Angeboten) + Unternehmensseite Formatschnitt | B2B-Käufer prüfen dort; wird von KI häufig als Personenquelle genutzt | 2 h |
| 3 | **Crew United**-Profil | DE-Branchendatenbank; rankt bereits für „Rössler“-Namen | 1 h |
| 4 | **Vimeo**-Profil mit Showreel/Projekten + Credits | Fachpublikum, gut indexiert | 1 h |
| 5 | **Explorers Connect, Malt, Twine, StaffMeUp, freelancermap.de** | genau diese Seiten ranken für „expedition filmmaker for hire“ und „Videoschnitt Freelancer“ | je 30–60 min |
| 6 | **drweb.de YouTube-Agentur-Vergleich**: Aufnahme anfragen | wird für DE-Agenturfragen zitiert | 0,5 h |
| 7 | **Presse-/Story-Pitch** an Bergwelten, bergsteigen.com (porträtieren Bergfilmer) und Explorers Connect „Inspire stories“ | redaktionelle Erwähnung = Fremdbeleg | 2–3 h |
| 8 | **Festival-Einreichung** der Bolivien-Doku, sobald fertig (EOFT, Bergfilmfestival Tegernsee, St. Anton, Banff) | stärkstes unabhängiges Signal; Voraussetzung für IMDb/Wikidata | später |
| 9 | **Podcast-Gast** in DE-B2B-Marketing-/YouTube-Nischenpodcasts (Thema: „Format-Schnitt statt Cutter-Stelle“) und Outdoor-/Reise-Podcasts | Erwähnung + Backlink + Transkript (wird indexiert) | 1–2 h je |
| 10 | YouTube-Kanal **@GuadiandMicha**: About-Text + Links zu micharoessler.com und Formatschnitt | eigene Plattform, Kanal ist bereits in `sameAs` | 15 min |
| – | **Wikidata:** derzeit **nicht empfohlen**. Belastbare unabhängige Referenzen fehlen, das Item würde wahrscheinlich gelöscht. Neu prüfen nach Festival-Selektion oder Presse. **Wikipedia:** nicht relevanzfähig. **IMDb:** YouTube-Dokus qualifizieren meist nicht; erst bei Festival/Distribution. **Google Business Profile:** nur mit verifizierbarer Adresse; bei Full-Time-Reise + US-LLC unrealistisch. | | |

---

## 6. Top-5 Quick Wins

1. **Formatschnitt indexierbar machen.** Domain entscheiden, canonical/hreflang/noindex/Sitemap korrigieren, GSC + Bing Webmaster Tools für beide Sites, Sitemaps einreichen. Ohne das rankt nichts. (≈1 h Micha, Rest C)
2. **F1 „Was kostet ein Cutter für YouTube?“ + F3 Preise-Seite mit `Offer`-Schema.** Die Daten und Quellen existieren schon im Code, die SERP-Konkurrenz ist schwach, und es ist die beste GEO-Chance des Projekts.
3. **Credits + Links in den 1,4-/1,2-Mio.-Videos** anfragen und **LinkedIn, Crew United und Vimeo** mit identischer Bio anlegen. Das macht aus „unbekannt“ eine verknüpfte Entität.
4. **A1 Documentary-Editing-Seite.** Der härteste vorhandene Beweis (2,6 Mio. Views über zwei Dokus) hat bisher keine eigene Leistungsseite. Dazu Profile auf Explorers Connect, Malt und Twine, die genau für diese Suchen ranken.
5. **Titles/H1 in Suchsprache.** Formatschnitt-Home: z. B. „YouTube-Videos schneiden lassen – Festpreis pro Folge | Formatschnitt“. Die Kunstwörter „Schnitt-System“ und „Folgen-Abo“ wandern in Untertitel und Fließtext. Die Adventure-DE-Home sollte „Kameramann“ früher im Title nennen (der einzige DE-Begriff mit Nachfrage).

---

## Anhang: Ehrliche Machbarkeit

- **Formatschnitt DE:** Die adressierbare Nachfrage über alle Käufer- und Kostenbegriffe liegt geschätzt bei wenigen hundert bis ~1.500 Suchen/Monat. Das ist klein, aber jeder Kunde bringt im ersten Jahr mindestens ~8.500 € (Setup 1.900 € + 3 × 2.200 €). Long-Tail-Kostenseiten (F1, F2, F5) sind in **3–6 Monaten** realistisch auf Seite 1, weil die heutige SERP aus Tools, US-Blogs und Q&A-Farmen besteht. Unrealistisch sind „youtube agentur“, „video editor freelancer“ und „videoschnitt kosten“ (Kopf) in diesem Zeitraum.
- **Formatschnitt EN:** Eine Head-Term-Chance gibt es nicht. Der Preis liegt über den US-Abo-Anbietern. Nur F11 mit EU-Winkel lohnt sich.
- **Adventure:** Organischer Käufer-Traffic bleibt auch nach Umsetzung im niedrigen zweistelligen Bereich pro Monat. „expedition filmmaker“ und „documentary editor for hire“ sind in 3–6 Monaten erreichbar (schwache, profilgetriebene SERP). Den eigentlichen Hebel bilden Entität, Profile, Credits und Festivals, weil Käufer dort und über KI-Empfehlungen suchen. Die Erfahrungsartikel bringen Reichweite und Zitierbarkeit, aber kaum direkte Anfragen.
- **Alle Volumenangaben sind Schätzungen.** Vor größeren Investitionen den Ahrefs-Connector autorisieren (Keywords Explorer, DE/US, KD + SERP-Overview). Nach 6–8 Wochen gegen echte GSC-Impressionen prüfen.
