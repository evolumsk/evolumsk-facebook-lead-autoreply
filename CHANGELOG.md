# Changelog

Všetky podstatné zmeny šablóny. Formát podľa [Keep a Changelog](https://keepachangelog.com/sk/1.1.0/), verziovanie [SemVer](https://semver.org/lang/sk/).

## [Unreleased]

## [1.0.0] — 2026-11-24

### Added

- Prvé verejné vydanie šablóny „Meta Lead → e-mail odpoveď" pre n8n.
- Hlavný workflow `templates/workflow-meta-leads-email-reply.json` (14 uzlov):
  - 5-minútový cyklus, 10-minútová brzda, deduplikácia e-mailov,
  - stavový automat `email_status` (`PROCESSING` / `SENT` / `DUPLICATE_SKIPPED` / `SKIP`),
  - HTML e-mail s tromi `mailto:` tlačidlami na výber času hovoru,
  - Telegram notifikácie „Nový lead" a „E-mail odoslaný",
  - testovacia vetva `Force Test (1st Row)` na overenie bez čakania.
- Error workflow `templates/workflow-error-notifier.json` (Error Trigger → Telegram).
- Zdrojové kódy Code uzlov: `code-filter-deduplicate.js`, `code-prepare-lead-data.js`.
- HTML šablóna e-mailu `email-layout.html` s dôrazom na doručiteľnosť a dark mode.
- Príklad štruktúry Google Sheetu `google-sheet-example.csv`.
- Dokumentácia:
  - `NAVOD.md` — návod na nasadenie krok za krokom,
  - `docs/01-priprava.md` — prerekvizity, credentials, DNS, Meta → Sheets,
  - `docs/02-postup-nasadenia.md` — import, konfigurácia, test, aktivácia, rollback,
  - `docs/03-architektura-workflowu.md` — uzly, dátový kontrakt, stavový automat,
  - `docs/04-email-layout.md` — dizajn e-mailu a doručiteľnosť,
  - `docs/05-google-sheet.md` — štruktúra Sheetu a pravidlá údržby,
  - `docs/06-prevadzka-a-incidenty.md` — monitoring, incidenty, rollback,
  - `docs/07-qa-checklist.md` — testovací protokol pred produkciou,
  - `docs/08-personalizacia-pre-inu-firmu.md` — white-label checklist a texty podľa odvetvia,
  - `docs/09-bezpecnost-a-sukromie.md` — PII, prístupy, retencia, incidenty.

### Security

- Šablóna neobsahuje žiadne konkrétne ID, API kľúče, heslá, e-maily ani telefónne čísla.
- Všetky hodnoty sú nahradené zástupnými výrazmi v tvare `[[NAZOV]]`.
- `credentials` bloky sú z JSON zámerne odstránené — priraďujú sa až v n8n.
