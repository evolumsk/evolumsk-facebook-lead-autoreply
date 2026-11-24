# Meta Lead → e-mail odpoveď (n8n šablóna)

> Univerzálna n8n automatizácia: nový lead z Meta Instant Formu dostane personalizovaný e-mail s výberom času hovoru — s deduplikáciou, Telegram notifikáciou a stavovým automatom v Google Sheete.

**Verzia šablóny:** 1.0.0 · **Jazyk:** slovenčina · **Prostredie:** self-hosted n8n

Tento balík je **na firmu nezávislá šablóna**. Neobsahuje žiadne konkrétne ID, API kľúče, heslá, e-maily ani telefónne čísla. Všetky hodnoty, ktoré treba doplniť, sú označené zástupnými výrazmi v tvare `[[NAZOV]]` (viď [zoznam zástupných hodnôt](docs/01-priprava.md#6-zoznam-zástupných-hodnôt)).

---

## 1. Pre koho je balík určený

- Pre firmy, ktoré zbierajú dopyty cez **Meta Instant Form** (Facebook / Instagram Lead Ads) a chcú na ne odpovedať do 15 minút.
- Pre agentúry a freelancerov, ktorí potrebujú **hotové, otestované riešenie** a chcú ho nasadiť u klienta za hodinu.
- Pre prevádzkovateľov, ktorí chcú mať **plnú kontrolu** — vlastný SMTP server, vlastný Google Sheet, vlastný Telegram bot a žiadnu ďalšiu platenú platformu.

Balík nevyžaduje programátora. Vyžaduje však ochotu prejsť [návod](NAVOD.md) krok za krokom a otestovať výsledok podľa [QA checklistu](docs/07-qa-checklist.md).

---

## 2. Čo rieši

| Problém | Riešenie v šablóne |
|---|---|
| Lead z Meta formulára zostane hodiny bez odpovede | e-mail odíde **10–15 minút** po odoslaní formulára |
| Odpoveď pôsobí ako okamžitý robot | zámerná 10-minútová brzda + osobné oslovenie menom |
| Ten istý človek vyplní formulár dvakrát | deduplikácia podľa e-mailu (`DUPLICATE_SKIPPED`) |
| Dvojité odoslanie pri výpadku SMTP | zámok `PROCESSING` pred odoslaním, `Retry On Fail = OFF` |
| Operátor sa o leade dozvie neskoro | okamžitá Telegram notifikácia s klikateľným `tel:` a e-mailom |
| Nejasné, čo sa s leadom stalo | stavový automat priamo v Google Sheete (`email_status`, `sent_at`) |
| Výber času hovoru komplikuje klienta | 3 predvyplnené `mailto:` tlačidlá — bez kalendára a bez registrácie |
| Tichý pád workflowu | samostatný Error Workflow posiela chybu na Telegram |

---

## 3. Ako to funguje

```text
Meta Instant Form
      │  (natívna synchronizácia Meta → Google Sheets, mimo n8n)
      ▼
Google Sheet
      │
      ▼  každých 5 minút
┌──────────────────────────────────────────────────────────────┐
│ 1. Get All Leads            načítanie všetkých riadkov        │
│ 2. Filter & Deduplicate     prázdny stav + vek ≥ 10 min       │
│                             + deduplikácia e-mailu            │
│ 3. Is Ready To Send?                                          │
│      ├─ NIE → email_status = DUPLICATE_SKIPPED                │
│      └─ ÁNO → email_status = PROCESSING (zámok)               │
│               → Telegram „Nový lead"                          │
│               → e-mail cez vlastný SMTP (+ BCC)               │
│               → email_status = SENT + sent_at                 │
│               → Telegram „E-mail odoslaný"                    │
│ 4. akýkoľvek pád → Error Workflow → Telegram                  │
└──────────────────────────────────────────────────────────────┘
```

Detailný rozpis uzlov a dátového kontraktu: [`docs/03-architektura-workflowu.md`](docs/03-architektura-workflowu.md).

---

## 4. Obsah balíka

```text
.
├─ README.md                                  # tento prehľad
├─ NAVOD.md                                   # návod na nasadenie krok za krokom
├─ VERSION                                    # verzia šablóny
├─ CHANGELOG.md                               # história zmien šablóny
├─ docs/
│  ├─ 01-priprava.md                          # prerekvizity, credentials, DNS, Meta → Sheets
│  ├─ 02-postup-nasadenia.md                  # import, nahradenie hodnôt, test, aktivácia
│  ├─ 03-architektura-workflowu.md            # uzly, tok dát, stavový automat, rozhodnutia
│  ├─ 04-email-layout.md                      # dizajn e-mailu a doručiteľnosť
│  ├─ 05-google-sheet.md                      # štruktúra Sheetu a príklad
│  ├─ 06-prevadzka-a-incidenty.md             # monitoring, incidenty, rollback
│  ├─ 07-qa-checklist.md                      # testovací protokol pred produkciou
│  ├─ 08-personalizacia-pre-inu-firmu.md      # čo zmeniť pre konkrétnu firmu
│  └─ 09-bezpecnost-a-sukromie.md             # PII, prístupy, GDPR
└─ templates/
   ├─ workflow-meta-leads-email-reply.json    # hlavný workflow na import
   ├─ workflow-error-notifier.json            # Error Workflow na import
   ├─ code-filter-deduplicate.js              # kód uzla „Filter & Deduplicate Leads"
   ├─ code-prepare-lead-data.js               # kód uzla „Prepare Lead Data"
   ├─ email-layout.html                       # HTML šablóna e-mailu
   └─ google-sheet-example.csv                # príklad hlavičky a riadkov Sheetu
```

---

## 5. Rýchly štart

| # | Krok | Odkaz | Čas |
|---|---|---|---|
| 1 | Prečítajte si prípravu a pripravte prístupy (Google, SMTP, Telegram, Meta → Sheets) | [docs/01-priprava.md](docs/01-priprava.md) | 20–30 min |
| 2 | Nahraďte zástupné hodnoty `[[…]]` v JSON súboroch a v HTML | [docs/02-postup-nasadenia.md](docs/02-postup-nasadenia.md) | 10 min |
| 3 | Importujte workflowy do n8n a priraďte credentials | [docs/02-postup-nasadenia.md](docs/02-postup-nasadenia.md) | 10 min |
| 4 | Otestujte celú vetvu podľa checklistu | [docs/07-qa-checklist.md](docs/07-qa-checklist.md) | 15–25 min |
| 5 | Aktivujte a nastavte monitoring | [docs/06-prevadzka-a-incidenty.md](docs/06-prevadzka-a-incidenty.md) | 5 min |

Podrobný sprievodca s vysvetlením: [`NAVOD.md`](NAVOD.md).

---

## 6. Čo potrebujete

| Systém | Požiadavka | Poznámka |
|---|---|---|
| n8n | self-hosted alebo cloud, verzia s uzlami `googleSheets` 4.7, `emailSend` 2.1, `telegram` 1.2 | šablóna je exportovaná z n8n 1.x |
| Google | účet s prístupom k cieľovému Sheetu | OAuth2 credential v n8n |
| Meta | aktívna Lead Ads kampaň + natívna synchronizácia do Google Sheets | nastavuje sa v Meta Ads Manageri, nie v n8n |
| SMTP | vlastná doménová schránka (HestiaCP, WebSupport, mailserver…) | ideálne s SPF, DKIM, DMARC a PTR |
| Telegram | bot vytvorený cez `@BotFather` + cieľový chat/kanál | bot musí byť v kanáli admin |
| Čas | 60–90 minút na prvé nasadenie | vrátane testov |

---

## 7. Zámerné architektonické rozhodnutia

Tieto rozhodnutia nie sú obmedzenia — sú to vedomé voľby, ktoré držia riešenie lacné, stabilné a kontrolovateľné:

1. **Žiadne Meta / Facebook Graph API.** Synchronizácia Meta → Google Sheets beží natívne. n8n číta iba Sheet, takže nepotrebuje žiadne Meta tokeny ani app review.
2. **Žiadny e-mailový provider (Brevo, Mailchimp, SendGrid, Resend).** Odosiela sa cez vlastnú doménovú schránku, čo znižuje riziko pádu do priečinka *Reklamy* a drží infrastruktúru pod kontrolou firmy.
3. **Žiadny kalendár (Calendly, Cal.com, Google Calendar).** Výber času hovoru riešia tri `mailto:` tlačidlá. Klient nemusí nič potvrdzovať, nič sa neplatí.
4. **Žiadny `Wait` node.** Oneskorenie sa počíta porovnaním času `created_time` pri 5-minútovom cykle. Workflow je bezstavový a prežije reštart servera.
5. **Žiadna n8n Data Table.** Jediným zdrojom pravdy je Google Sheet — všetky dáta, stavy aj poznámky sú na jednom mieste.
6. **Žiadny WhatsApp.** Komunikácia je e-mail + telefón. WhatsApp nie je súčasťou riešenia ani v podobe odkazov.

---

## 8. Bezpečnosť a súkromie

- Šablóna **neobsahuje** žiadne secrets, API kľúče, heslá, reálne e-maily ani telefónne čísla.
- Credentials sa vytvárajú **priamo v n8n** a nikdy sa necommitujú do gitu.
- Leady sú osobné údaje — do repozitára nepatria exporty exekúcií ani screenshoty s kontaktmi.
- Odporúčania k PII, retencii a prístupom: [`docs/09-bezpecnost-a-sukromie.md`](docs/09-bezpecnost-a-sukromie.md).

---

## 9. Verzia a licencia

- Verzia šablóny: `1.0.0` (viď [`VERSION`](VERSION), zmeny v [`CHANGELOG.md`](CHANGELOG.md)).
- Balík je určený na voľné použitie a úpravy. Ak ho zverejníte, doplňte si vlastný súbor `LICENSE` podľa toho, aké podmienky chcete stanoviť.
- Autor neručí za doručiteľnosť e-mailov ani za správanie tretích strán (Meta, Google, poskytovateľ SMTP). Pred produkciou vždy prejdite QA checklist.
