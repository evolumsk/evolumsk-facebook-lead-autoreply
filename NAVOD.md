# Návod na nasadenie

> Kompletný sprievodca nasadením šablóny „Meta Lead → e-mail odpoveď" do vlastného n8n. Postupujte prosím v uvedenom poradí — jednotlivé fázy na seba nadväzujú.

**Odhadovaný čas:** 60–90 minút pri prvom nasadení (vrátane testov).
**Čo budete potrebovať:** prístup do n8n, Google účet, doménový e-mail (SMTP), Telegram, aktívnu Meta Lead Ads kampaň.

---

## Ako si návod rozvrhnúť

| Fáza | Čo urobíte | Dokument | Čas |
|---|---|---|---|
| 1 | Pripravíte prístupy a prerekvizity | [docs/01-priprava.md](docs/01-priprava.md) | 20–30 min |
| 2 | Nahradíte zástupné hodnoty v JSON a HTML | [docs/02-postup-nasadenia.md](docs/02-postup-nasadenia.md) | 10 min |
| 3 | Importujete workflowy a priradíte credentials | [docs/02-postup-nasadenia.md](docs/02-postup-nasadenia.md) | 10 min |
| 4 | Overíte štruktúru Google Sheetu | [docs/05-google-sheet.md](docs/05-google-sheet.md) | 5 min |
| 5 | Prispôsobíte e-mail svojej firme | [docs/04-email-layout.md](docs/04-email-layout.md) | 10 min |
| 6 | Otestujete celú vetvu | [docs/07-qa-checklist.md](docs/07-qa-checklist.md) | 15–25 min |
| 7 | Aktivujete a nastavíte monitoring | [docs/06-prevadzka-a-incidenty.md](docs/06-prevadzka-a-incidenty.md) | 5 min |

---

## Fáza 1 — Príprava

Cieľom je mať **všetky prístupy hotové skôr, než sa dotknete n8n**. Nič sa neimplementuje „za behu".

- [ ] Máte n8n inštanciu s vlastným prihlásením a právami na vytváranie credentials.
- [ ] Máte Google účet, ktorý vidí cieľový Google Sheet.
- [ ] Máte doménovú e-mailovú schránku s prístupom k SMTP (host, port, šifrovanie, heslo).
- [ ] Máte Telegram a viete si vytvoriť bota cez `@BotFather`.
- [ ] Viete, do ktorého Google Sheetu Meta zapisuje leady (alebo to viete nastaviť).
- [ ] Pre doménu máte vyriešené SPF, DKIM, DMARC a ideálne aj PTR.

Podrobný postup ku každému bodu: [`docs/01-priprava.md`](docs/01-priprava.md).

> **Nepokračujte**, kým nemáte overené aspoň SMTP a Google prístup. Väčšina zlyhaní pri nasadení vzniká presne tu.

---

## Fáza 2 — Nahradenie zástupných hodnôt

Celý balík používa jednotný tvar `[[NAZOV]]` (dve hranaté zátvorky). Prečo nie `{{ }}`? Pretože n8n používa `{{ }}` na výrazy — hranaté zátvorky zabraňujú kolízii a nedajú sa omylom vyhodnotiť.

1. Otvorte [`docs/01-priprava.md`](docs/01-priprava.md#6-zoznam-zástupných-hodnôt) a poznačte si hodnoty.
2. Otvorte `templates/workflow-meta-leads-email-reply.json`, `templates/workflow-error-notifier.json` a `templates/email-layout.html`.
3. V editore (VS Code, Notepad++) použite **Find & Replace** pre každú hodnotu.
4. Skontrolujte, že v súboroch nezostal ani jeden reťazec `[[`.

**Tip:** Ak pracujete na Windows, môžete použiť PowerShell:

```powershell
$files = Get-ChildItem -Recurse -Include *.json,*.html,*.js -Path .\templates
foreach ($f in $files) {
  (Get-Content -Raw $f.FullName) -replace '\[\[SHEET_ID\]\]', '1AbC...' | Set-Content -NoNewline -Encoding utf8 $f.FullName
}
```

> **Pozor:** pred hromadným nahradením si súbory zálohujte. Po nahradení overte, že JSON sa stále dá načítať (napr. otvorením v n8n).

---

## Fáza 3 — Import a credentials

1. V n8n otvorte **Workflows → Import from File** a vyberte `workflow-meta-leads-email-reply.json`.
2. Rovnakým spôsobom importujte `workflow-error-notifier.json`.
3. Otvorte hlavný workflow a postupne priraďte credentials:
   - **Google Sheets** — všetky 5 uzlov (Get All Leads, Get 1st Row, Mark Duplicate Skipped, Lock Row, Mark Row SENT).
   - **SMTP** — uzol `Send Follow-up Email`.
   - **Telegram** — oba notifikačné uzly.
4. V uzloch Google Sheets skontrolujte, že je vybraný správny dokument a hárok. Ak sa hárok nezobrazí, vyberte ho manuálne z rozbaľovacieho zoznamu (JSON obsahuje iba textový popis, nie interné ID hárku).
5. V **Settings → Error Workflow** vyberte importovaný `Meta Leady – Error Notifier`.
6. Spustite validáciu (v UI „Save" alebo cez MCP `n8n_validate_workflow`). Musí byť bez chýb.

> **Nikdy** nevkladajte credentials blok s vymysleným ID do JSON. Keď credential v n8n neexistuje, nechajte pole prázdne a vyberte ho v UI.

---

## Fáza 4 — Google Sheet

Overte, že váš Sheet má:

- stĺpec s unikátnym ID leadu (Meta ho plní automaticky),
- stĺpec s časom vytvorenia (`created_time`),
- stĺpce pre meno, e-mail a telefón,
- technické stĺpce `email_status` a `sent_at` **úplne vpravo**,
- voliteľne stĺpec `notes` pre operátora (workflow doň nikdy nezapisuje).

Presná štruktúra, stavový automat a pravidlá: [`docs/05-google-sheet.md`](docs/05-google-sheet.md). Vzorový súbor: [`templates/google-sheet-example.csv`](templates/google-sheet-example.csv).

> **Kritické:** pred aktiváciou označte všetky historické riadky v `email_status` hodnotou `SKIP`. Inak im workflow pošle spätný e-mail.

---

## Fáza 5 — E-mail

1. Otvorte `templates/email-layout.html` a upravte texty, farbu a podpis.
2. Ak meníte text v `subject` alebo `body` pri `mailto:` odkazoch, **URL-enkódujte ho** (diakritika a medzery). Návod a nástroj: [`docs/04-email-layout.md`](docs/04-email-layout.md).
3. Hotové HTML vložte do uzla `Send Follow-up Email` do poľa **HTML**.
4. Skontrolujte predmet, odosielateľa, `Reply-To` a `BCC`.
5. Overte, že `Retry On Fail` je **vypnuté** a `Append n8n Attribution` je **vypnuté**.

---

## Fáza 6 — Test

Prejdite [`docs/07-qa-checklist.md`](docs/07-qa-checklist.md) fázu po fáze. Minimum pred aktiváciou:

- [ ] Testovací e-mail dorazil do **Hlavná (Primary)**, nie do Spamu ani Reklám.
- [ ] Tri tlačidlá otvoria správnu predvyplnenú správu s nepoškodenou diakritikou.
- [ ] `tel:` odkaz funguje.
- [ ] BCC kópia dorazila.
- [ ] Telegram prišiel dvakrát (nový lead + odoslané) a je čitateľný.
- [ ] Sheet má po teste `SENT` a `sent_at`.
- [ ] Druhý beh nič neodošle (stavový automat).
- [ ] Duplicitný e-mail skončí ako `DUPLICATE_SKIPPED`.
- [ ] Chyba (napr. zlý SMTP port) spustí Error Workflow.

---

## Fáza 7 — Aktivácia a prevádzka

1. Odstráňte testovacie riadky zo Sheetu **celé** (nie len vyprázdnite bunky).
2. Skontrolujte, že v produkčnej vetve nie je dočasný `Limit` uzol.
3. Prepnite workflow na **Active**.
4. Sledujte prvé dva behy v **Executions**.
5. Nastavte si týždennú kontrolu podľa [`docs/06-prevadzka-a-incidenty.md`](docs/06-prevadzka-a-incidenty.md).

---

## Časté otázky pri nasadení

### E-mail neodišiel, hoci lead pribudol

1. Je workflow **Active**?
2. Je riadok v správnom hárku a má prázdny `email_status`?
3. Je `created_time` starší ako 10 minút a čitateľný?
4. Nepoužil už rovnaký e-mail skôr? (`SENT` / `PROCESSING` blokuje)
5. Čo hovoria **Executions**?

### V Sheete sa nič nezapísalo

Pravdepodobne nesedí názov technického stĺpca. Skontrolujte [`docs/05-google-sheet.md`](docs/05-google-sheet.md) a `[[STLPEC_STAV]]` / `[[STLPEC_ODOSLANE]]`.

### Telegram vráti 400 Bad Request

Text obsahuje neescapované `<`, `>`, `&` alebo sa nevyhodnotil výraz. Uzol `Prepare Lead Data` tieto znaky escapuje do polí `tg_*` — používajte ich, nie surové hodnoty.

### E-mail spadol do Reklám

Prejdite pravidlá doručiteľnosti v [`docs/04-email-layout.md`](docs/04-email-layout.md) a overte SPF/DKIM/DMARC.

### Ako riešiť incidenty

[`docs/06-prevadzka-a-incidenty.md`](docs/06-prevadzka-a-incidenty.md) — zaseknutý `PROCESSING`, výpadok SMTP, duplicitné odoslanie, zmena stĺpca zo strany Metay, rollback.

---

## Čo nikdy nerobiť

- Necommitujte do gitu `.env`, heslá, tokeny ani exporty exekúcií s kontaktmi.
- Neaktivujte workflow na hárku s historickými riadkami bez `SKIP`.
- Nezapínajte `Retry On Fail` na odosielaní e-mailu.
- Nemeňte názvy a poradie stĺpcov, ktoré vytvorila Meta.
- Neupravujte Sheet ručne počas behu workflowu (môže vzniknúť súbeh).
- Neposielajte testovacie e-maily na reálne leady.
