# Architektúra workflowu

> Ako je workflow postavený, aké dáta tečú medzi uzlami, prečo sú použité práve tieto uzly a kde sú hranice návrhu. Dokument slúži na pochopenie a bezpečné úpravy.

---

## 1. Prehľad

Workflow je **bezstavový**: nemá `Wait` node ani dlhobežiacu pamäť. Každých 5 minút sa pozrie na celý Sheet, vyberie vhodné riadky a spracuje ich. Vďaka tomu prežije reštart n8n aj výpadok servera.

```text
Every 5 Minutes
      │
      ▼
Get All Leads ─────────────► Filter & Deduplicate Leads
                                   │
                                   ▼
                            Is Ready To Send?
                              │            │
                        SEND │            │ DUPLICATE
                              ▼            ▼
                       Prepare Lead Data  Mark Duplicate Skipped
                              │
                              ▼
                     Lock Row (PROCESSING)
                              │
                              ▼
                    Notify Telegram – New Lead
                              │
                              ▼
                     Send Follow-up Email
                              │
                              ▼
                        Mark Row SENT
                              │
                              ▼
                     Notify Telegram – Sent
```

Testovacia vetva:

```text
Force Test (1st Row) → Get 1st Row (Force) → Limit First Row → Prepare Lead Data
```

Obe vetvy sa spájajú v uzle `Prepare Lead Data`, ktorý je **jediným normalizérom** dát pre e-mail a Telegram.

---

## 2. Uzly a ich úloha

| # | Uzol | Typ | Úloha |
|---|---|---|---|
| 1 | `Every 5 Minutes` | Schedule Trigger | spustenie každých 5 minút |
| 2 | `Get All Leads` | Google Sheets | načítanie všetkých riadkov (kvôli deduplikácii) |
| 3 | `Filter & Deduplicate Leads` | Code | výber nových, dostatočne starých a ne-duplicitných leadov |
| 4 | `Is Ready To Send` | IF | vetvenie `SEND` vs. `DUPLICATE_SKIPPED` |
| 5 | `Mark Duplicate Skipped` | Google Sheets | zápis `DUPLICATE_SKIPPED` |
| 6 | `Lock Row (PROCESSING)` | Google Sheets | zámok riadku pred SMTP |
| 7 | `Notify Telegram – New Lead` | Telegram | okamžitá notifikácia operátorovi |
| 8 | `Send Follow-up Email` | Send Email | odoslanie HTML e-mailu cez SMTP |
| 9 | `Mark Row SENT` | Google Sheets | zápis `SENT` + `sent_at` |
| 10 | `Notify Telegram – Sent` | Telegram | potvrdenie odoslania |
| 11 | `Force Test (1st Row)` | Manual Trigger | manuálny test bez čakania |
| 12 | `Get 1st Row (Force)` | Google Sheets | načítanie prvého riadku |
| 13 | `Limit First Row` | Limit | práve 1 položka |
| 14 | `Prepare Lead Data` | Code | normalizácia, escapovanie, `tel:` formát |

---

## 3. Dátový kontrakt

### 3.1 Vstup z Google Sheetu

Očakáva sa hlavička s týmito logickými stĺpcami (presné názvy sa nastavujú v `CONFIG.columns`):

| Logický stĺpec | Význam | Povinný |
|---|---|---|
| `id` | unikátne ID leadu | áno |
| `created_time` | čas vytvorenia | áno |
| `full_name` | meno | nie |
| `email` | e-mail | áno (bez neho sa nespracuje) |
| `phone_number` | telefón | nie |
| `sluzba` | vlastná otázka 1 | nie |
| `rozpocet` | vlastná otázka 2 | nie |
| `email_status` | stav workflowu | áno |
| `sent_at` | čas odoslania | áno |

### 3.2 Výstup uzla `Filter & Deduplicate Leads`

Každá položka obsahuje:

| Pole | Význam |
|---|---|
| `lead_id` | ID leadu |
| `created_time` | pôvodný čas |
| `age_minutes` | vek leadu v minútach (zaokrúhlený) |
| `full_name` | očistené meno alebo `neuvedené` |
| `greeting_name` | meno s medzerou na oslovenie alebo prázdny reťazec |
| `email` | e-mail |
| `phone_display` | telefón bez prefixu `p:` |
| `phone_tel` | telefón v E.164 pre `tel:` |
| `service`, `budget` | odpovede z formulára alebo `neuvedené` |
| `_action` | `SEND` alebo `DUPLICATE_SKIPPED` |

### 3.3 Výstup uzla `Prepare Lead Data`

Pridáva a zjednocuje:

| Pole | Použitie |
|---|---|
| `greeting_html` | HTML-escapované meno do oslovenia |
| `tg_name`, `tg_service`, `tg_budget` | escapované hodnoty pre Telegram |
| `tg_phone_display`, `tg_email` | escapované hodnoty pre Telegram |
| `row_number` | číslo riadku (ak ho Sheet vráti) |
| `_source` | `production` alebo `force` (diagnostika) |
| `_action` | vždy `SEND` pre testovaciu vetvu |

> Všetky výrazy v e-maile a Telegrame čítajú z `$('Prepare Lead Data')`. Nikdy nečítajte surové polia priamo zo Sheetu — obchádzate tým escapovanie a normalizáciu.

---

## 4. Prečo `Code` namiesto `Filter`

Jeden uzol `Code` nahrádza tri bežné uzly (`Filter`, `Remove Duplicates`, `Set`) a rieši veci, ktoré by v jednoduchom filtri ticho zlyhali:

1. **Nepredvídateľný formát času.** Meta môže zapísať ISO, slovenský formát aj Google Sheets serial number. `parseCreatedTime()` zvládne všetky tri.
2. **Deduplikácia naprieč celou históriou.** Set e-mailov zo stavov `SENT` a `PROCESSING` sa postaví v jednom prechode.
3. **Ochrana proti „polovičnému" spracovaniu.** Riadok bez čitateľného času sa radšej preskočí, než aby odišiel nesprávne.

To isté platí pre `Prepare Lead Data`: escapovanie `<`, `>`, `&` je povinné pre Telegram s `parse_mode = HTML`. Bez neho Telegram vráti `400 Bad Request`, keď má meno alebo odpoveď tieto znaky.

---

## 5. Stavový automat

| Stav | Význam | Kto zapisuje |
|---|---|---|
| *(prázdne)* | nový, nespracovaný | Meta / vy |
| `PROCESSING` | zámok pred SMTP | workflow |
| `SENT` | e-mail odovzdaný SMTP | workflow |
| `DUPLICATE_SKIPPED` | e-mail už raz dostal správu | workflow |
| `SKIP` | historický alebo ručne vyradený riadok | vy |

Prechody:

```text
""  ──► PROCESSING ──► SENT
""  ──► DUPLICATE_SKIPPED
""  ──► SKIP (ručne)
```

`SENT` a `SKIP` sú terminálne — workflow ich už nikdy nespracuje. `PROCESSING` je tiež blokujúci, kým ho operátor neopraví.

### 5.1 Prečo je zámok pred odoslaním

SMTP môže odpovedať pomaly. Ak by sa stav zapísal až po odoslaní, ďalší 5-minútový cyklus by mohol ten istý riadok vybrať znova a poslať druhý e-mail. Zápis `PROCESSING` pred volaním SMTP to znemožní.

### 5.2 Prečo je `Retry On Fail` vypnuté

Pri timeoute sa nedá spoľahlivo zistiť, či server e-mail prijal. Automatický retry by mohol odoslať duplikát. Riziko nedoručenia je nižšie ako riziko dvojitého e-mailu — preto je retry vypnuté a chyba ide na Telegram.

---

## 6. Súbežnosť a prečo je bezpečná

Teoretické riziko: dva 5-minútové cykly začnú takmer súčasne, oba prečítajú Sheet skôr, než prvý zapíše `PROCESSING` (okno 2–5 sekúnd), a oba odošlú e-mail.

Pri jednotkách leadov denne a rýchlom SMTP je to zanedbateľné. Ak chcete riziko úplne odstrániť:

- v n8n obmedzte súbežnosť exekúcií (napr. cez front mode s jediným workerom alebo cez interný zámok),
- alebo znížte frekvenciu na 10 minút (doručenie 10–20 min),
- alebo použite `PROCESSING` zápis s podmienkou (optimistický zámok).

Šablóna zámerne zostáva pri jednoduchom riešení — je čitateľná a pre bežnú prevádzku dostatočná.

---

## 7. Error handling

Samostatný workflow `Meta Leady – Error Notifier`:

```text
Error Trigger → Telegram (HTML správa)
```

Obsahuje názov workflowu, zlyhaný uzol, text chyby a odkaz na exekúciu. Priradí sa v **Settings → Error Workflow** hlavného workflowu.

Error workflow sa **nemusí aktivovať** — spúšťa sa referenciou. Odporúčame ho však nechať aktívny, aby ho bolo vidno v zozname.

### 7.1 Čo sa stane po chybe

1. Riadok zostane v `PROCESSING` (zámok sa už nezmení).
2. Operátor dostane Telegram.
3. Po overení, či e-mail odišiel, riadok buď opraví na `SENT`, alebo vymaže stav a nechá ho dobehnúť.

Postup: [`06-prevadzka-a-incidenty.md`](06-prevadzka-a-incidenty.md).

---

## 8. Hranice návrhu (čo zámerne nie je súčasťou)

| Vylúčené | Dôvod |
|---|---|
| Meta Graph API | synchronizácia beží natívne, tokeny nie sú potrebné |
| e-mailový provider (Brevo, SendGrid, …) | vlastný SMTP = kontrola a lepšia doručiteľnosť pre transakčné odpovede |
| Calendly / Cal.com / Google Calendar | `mailto:` tlačidlá sú jednoduchšie a bez poplatkov |
| n8n Data Table | jediný zdroj pravdy má byť Sheet |
| `Wait` node | bezstavové porovnanie času prežije reštart |
| WhatsApp | nie je súčasťou riešenia |

Ak niektoré z nich vyzerá ako „jednoduchšie riešenie", je to práve to, čo bolo vedome zamietnuté.

---

## 9. Rozšírenia, ktoré sa dajú pridať bez zásahu do jadra

- **Kópia e-mailu do CRM** — pridať HTTP Request alebo natívny uzol za `Mark Row SENT`.
- **Druhá pripomienka po 48 hodinách** — samostatný workflow čítajúci `sent_at`, nie úprava hlavného.
- **Report do ranného e-mailu** — samostatný workflow nad Sheetom.
- **Vlastný stav `REPLIED`** — doplniť manuálne alebo z odpovede v schránke (mimo tohto workflowu).
- **Viac jazykov** — samostatná vetva podľa hodnoty v Sheete; jadro zostáva rovnaké.

> Pri každom rozšírení platí: nový stav musí byť terminálny alebo explicitne ošetrený vo filtri, inak hrozí opätovné odoslanie.
