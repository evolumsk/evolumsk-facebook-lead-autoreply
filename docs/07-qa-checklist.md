# QA checklist pred aktiváciou

> Testovací protokol, ktorý je potrebné prejsť pred zapnutím workflowu do produkcie. Bez kompletne zeleného zoznamu workflow **neaktivujte**.

Doplňte údaje o testovaní:

| Parameter | Hodnota |
|---|---|
| Verzia šablóny | `_______` |
| Dátum testu | `_______` |
| Testoval | `_______` |
| Prostredie | `_______` |

---

## Fáza 0 — Predpoklady

- [ ] n8n inštancia beží a mám prístup do Executions.
- [ ] Google Sheets credential je pripojený a vidí cieľový Sheet.
- [ ] SMTP credential funguje (testovací e-mail dorazil).
- [ ] Telegram credential funguje (testovacia správa dorazila).
- [ ] `[[TELEGRAM_CHAT_ID]]` je vyplnené v oboch workflowoch.
- [ ] Všetky zástupné hodnoty `[[…]]` sú nahradené (vyhľadanie `[[` nič nenájde).
- [ ] Error Workflow je importovaný a priradený v Settings.
- [ ] DNS pre doménu odosielateľa: SPF, DKIM, DMARC, PTR overené.
- [ ] Workflow má 14 uzlov a všetky sú prepojené.

---

## Fáza 1 — Ochrana historických dát

- [ ] Všetky historické riadky majú `email_status = SKIP`.
- [ ] Žiadny historický riadok nemá prázdny `email_status`.
- [ ] Skontrolované aj staršie mesiace, nielen posledný týždeň.
- [ ] Poznámka: ak si nie ste istí, workflow neaktivujte.

---

## Fáza 2 — Testovací riadok

- [ ] Testovací lead má vyplnené `id`, `created_time`, meno, e-mail a telefón.
- [ ] E-mail je **vlastná testovacia adresa**, nie reálny lead.
- [ ] `created_time` je starší ako 10 minút (alebo upravený).
- [ ] `email_status` je prázdne.

---

## Fáza 3 — Izolovaný test jedného riadku

- [ ] Produkčná vetva vráti pri manuálnom spustení práve 1 položku s `_action = "SEND"`.
- [ ] Force vetva prejde celá bez chyby.
- [ ] `Prepare Lead Data` obsahuje `greeting_html` bez `undefined`.
- [ ] V uzloch nie je dočasný `Limit` (okrem testovacej vetvy).

---

## Fáza 4 — Overenie výstupov

- [ ] **Doručenie:** e-mail prišiel do **Hlavná (Primary)**, nie do Spamu ani Reklám.
- [ ] **Diakritika:** meno v oslovení je správne.
- [ ] **Tlačidlo 1:** otvorí novú správu, správny príjemca, nepoškodená diakritika.
- [ ] **Tlačidlo 2:** to isté.
- [ ] **Tlačidlo 3:** to isté.
- [ ] **`tel:` odkaz:** otvorí vytáčanie so správnym číslom.
- [ ] **Mobil:** e-mail je čitateľný na telefóne, tlačidlá sa nelámu.
- [ ] **BCC:** kópia dorazila do BCC schránky a filter ju roztriedil.
- [ ] **Telegram „Nový lead":** čisté HTML, bez rozbitých znakov, klikateľný telefón.
- [ ] **Telegram „Odoslané":** dorazil s časom.
- [ ] **Sheet:** `email_status = SENT` a `sent_at` v správnom tóne a pásme.
- [ ] **Šablóna e-mailu:** farba tlačidiel zodpovedá `[[FARBA_ZNACKY]]`.
- [ ] **Podpis:** obsahuje firmu, meno, telefón, e-mail a web.

---

## Fáza 5 — Ochrana proti duplicite

- [ ] Druhý beh bez zmeny v Sheete vráti **0 items** a nič sa neodošle.
- [ ] Nový riadok s rovnakým e-mailom (starší ako 10 min, prázdny stav) skončí ako `DUPLICATE_SKIPPED`.
- [ ] Pri duplikáte sa e-mail **neodošle** a Telegram nepošle „Nový lead".

---

## Fáza 6 — Časová brzda

- [ ] Riadok mladší ako 10 minút je pri behu preskočený.
- [ ] Ten istý riadok po uplynutí 10+ minút je spracovaný.
- [ ] Riadok s nečitateľným `created_time` je preskočený (zámerne).

---

## Fáza 7 — Error handling

- [ ] Úmyselne nesprávny SMTP port → beh zlyhá.
- [ ] Error Workflow pošle Telegram s názvom workflowu, uzlom a chybou.
- [ ] Riadok zostane v `PROCESSING` (očakávané).
- [ ] Po oprave a vymazaní `PROCESSING` sa lead doodošle.
- [ ] Po oprave je SMTP port vrátený na správnu hodnotu.

---

## Fáza 8 — Upratanie a aktivácia

- [ ] Odopnuté prípadné **Pin data**.
- [ ] Dočasné `Limit` uzly odstránené (okrem testovacej vetvy).
- [ ] Testovacie riadky odstránené **celé** (nie len vyprázdnené).
- [ ] Export workflowu uložený mimo repozitára alebo v repozitári bez hodnôt.
- [ ] Error Workflow priradený a otestovaný.
- [ ] Workflow **Active**.
- [ ] Prvý produkčný beh skontrolovaný v Executions.
- [ ] Do Notes workflowu zapísaná verzia a dátum.

---

## Záznam o schválení

| Dátum | Verzia | Výsledok | Podpis |
|---|---|---|---|
| | | | |
| | | | |

> Ak ktorýkoľvek bod zlyhá, workflow **neaktivujte**. Opravte príčinu a prejdite dotknutú fázu znova.
