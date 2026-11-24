# Prevádzka a incidenty

> Každodenná a týždenná kontrola, riešenie typických incidentov a bezpečné zastavenie alebo obnovenie workflowu.

Časová zóna všetkých časov: podľa nastavenia workflowu (predvolene `Europe/Bratislava`).

---

## 1. Monitoring — čo sledovať

| Signál | Kde | Očakávanie |
|---|---|---|
| Nový lead | Telegram | do 10–15 minút od odoslania formulára |
| Odoslaný e-mail | BCC schránka / priečinok | presne raz na lead |
| Stav | Google Sheet `email_status`, `sent_at` | `SENT` s časom |
| Chyby | Error Workflow → Telegram | okamžite pri páde |
| Behy | n8n → Executions | každých 5 minút, bez chýb |

### 1.1 Denná kontrola (1 minúta)

- [ ] Prišla aspoň jedna Telegram notifikácia alebo je v Sheete nový `SENT`.
- [ ] V Executions nie je červený beh za posledných 24 hodín.
- [ ] Žiadny riadok nezostal v `PROCESSING`.

### 1.2 Týždenná hygiena (5 minút)

- [ ] Skontrolujte všetky riadky v `PROCESSING` (nemali by prežiť viac ako hodinu).
- [ ] Prejdite chybové exekúcie a uistite sa, že každá má riešenie.
- [ ] Overte, že história exekúcií sa čistí (14–30 dní).
- [ ] Skontrolujte doručiteľnosť — pozrite sa do BCC priečinka, či e-maily nepadajú do Spamu.
- [ ] Overte, že Meta stále zapisuje leady (jeden testovací lead raz za čas).

---

## 2. Manuálny test bez čakania

Vetva `Force Test (1st Row)` slúži na overenie odosielacej časti:

1. n8n → workflow → uzol `Force Test (1st Row)` → **Test step**.
2. Beží: `Get 1st Row (Force)` → `Limit First Row` → `Prepare Lead Data` → `Lock Row (PROCESSING)` → Telegram → e-mail → `SENT` → Telegram.

**Čo sa ignoruje:** časová brzda, existujúci `email_status` (aj `SKIP`) a deduplikácia. Preto sa dá ten istý riadok testovať opakovane.

**Dôsledok:** prvému dátovému riadku sa prepíše stav a doplní `sent_at`; e-mail reálne odíde na adresu z tohto riadku a prídu dve Telegram správy.

> Test mení produkčné dáta. Ak nechcete, aby e-mail odišiel reálnemu človeku, použite testovací riadok alebo ho pred testom upravte.

---

## 3. Incidenty

### 3.1 Riadok zostal v `PROCESSING`

**Príznak:** lead má `PROCESSING`, `sent_at` prázdne, v Telegrame prišla notifikácia o novom leade.

**Príčina:** pád medzi zámkom a zápisom `SENT` — najčastejšie SMTP.

**Postup:**

1. Otvorte **Executions** → nájdite beh s chybou → pozrite zlyhaný uzol.
2. Zistite, či e-mail reálne odišiel:
   - BCC schránka / priečinok `Automatické odpovede`,
   - log mailservera (napr. `/var/log/exim4/mainlog`, hľadajte `=>` a `250 OK`),
   - odpoveď od klienta (ak už reagoval).
3. **Ak e-mail neodišiel:** vymažte `email_status` (na prázdno). Workflow riadok spracuje v najbližšom cykle.
4. **Ak e-mail odišiel:** prepíšte `email_status` na `SENT` a doplňte `sent_at` ručne.

> Nikdy nenechávajte `PROCESSING` „na neskôr" — blokuje deduplikáciu pre daný e-mail.

### 3.2 SMTP zlyháva opakovane

**Príznak:** Telegram notifikácie z error workflowu, viac riadkov v `PROCESSING`.

**Postup:**

1. Overte credential (host, port, šifrovanie, platnosť hesla).
2. Overte DNS: SPF, DKIM, DMARC, PTR.
3. Odošlite testovací e-mail na vlastnú adresu (manuálny beh uzla `Send Follow-up Email` s pevne zadaným príjemcom).
4. Skontrolujte, či poskytovateľ neobmedzil odosielanie (rate limit, blokácia).
5. Pri výpadku dlhšom ako 1 hodinu workflow deaktivujte, leady obslúžte telefonicky a po oprave ich dobehnite.

### 3.3 Klient dostal e-mail dvakrát

**Príznak:** sťažnosť alebo dva rovnaké záznamy v BCC.

**Možné príčiny:**

- `Retry On Fail` bolo omylom zapnuté na `Send Follow-up Email`,
- bežia dve kópie workflowu (napr. duplicitný import),
- manuálny test na reálnom riadku,
- súbeh dvoch cyklov (viď [architektúru](03-architektura-workflowu.md#6-súbežnosť-a-prečo-je-bezpečná)).

**Postup:** okamžite overte `Retry On Fail = OFF`, skontrolujte zoznam workflowov na duplicity a obmedzte manuálne testy na vlastnú adresu.

### 3.4 Meta zmenila hlavičku stĺpca

**Príznak:** e-maily odchádzajú bez mena, so `neuvedené`, alebo Code uzol nič nevráti.

**Postup:** spustite `Get All Leads` → pozrite reálne kľúče → upravte `CONFIG.columns` v oboch Code uzloch → uložte → otestujte.

> Zmena názvu stĺpca zo strany Metay sa môže stať pri zmene jazyka účtu alebo formulára.

### 3.5 Workflow nespracuje nič, aj keď lead pribudol

**Checklist:**

1. Je workflow **Active**?
2. Je nový riadok v správnom hárku (nie v inom liste)?
3. Je `email_status` naozaj prázdne (bez medzery)?
4. Je `created_time` starší ako 10 minút a čitateľný?
5. Nepoužil už rovnaký e-mail skôr? (`SENT` / `PROCESSING` blokuje)
6. Existuje beh v posledných 5 minútach v **Executions**?

### 3.6 E-mail chodí do Reklám alebo Spamu

**Postup:**

1. Overte SPF, DKIM, DMARC a PTR (viď [layout](04-email-layout.md#6-doručiteľnosť--praktický-checklist)).
2. Skontrolujte obsah — obrázky, priveľa odkazov, „marketingové" slová.
3. Odošlite test na Gmail a pozrite hlavičky (`Authentication-Results`).
4. Ak je doména nová, doručiteľnosť sa buduje postupne — prvých pár e-mailov môže skončiť inde.

### 3.7 Telegram neposiela

**Príznak:** `400 Bad Request`, `chat not found`, `Forbidden`.

**Postup:**

1. Bot musí byť v chate/kanáli a pri kanáli **admin**.
2. Overte `chat_id` (súkromný chat začína číslom, kanál `-100…`).
3. Overte, že text neobsahuje neescapované `<`, `>`, `&` — používajte polia `tg_*` z `Prepare Lead Data`.
4. Overte platnosť tokenu cez `getMe`.

### 3.8 Čas v Sheete nesedí

**Príčina:** časové pásmo workflowu alebo výraz `$now.setZone(...)`.

**Postup:** zjednoťte pásmo na všetkých miestach — **Settings → Timezone** a dva výrazy `sent_at` (uzly `Mark Row SENT` a `Notify Telegram – Sent`).

---

## 4. Zastavenie a obnovenie

### 4.1 Dočasné zastavenie

1. Workflow **Deactivate**.
2. Leady sa hromadia v Sheete s prázdnym stavom.
3. Po oprave workflow **Activate** — 10-minútová brzda ich pustí v najbližších cykloch.

> Ak boli leady medzitým obslúžené telefonicky, označte ich `SKIP`, aby nedostali e-mail.

### 4.2 Rollback

1. Deaktivujte workflow.
2. Použite históriu verzií n8n alebo importujte predchádzajúcu zálohu JSON.
3. Znovu priraďte credentials (import ich neobsahuje).
4. Prejdite QA checklist aspoň v skrátenej verzii.
5. Aktivujte a sledujte dva behy.

### 4.3 Úplné vypnutie

Deaktivujte oba workflowy (hlavný aj error). Meta ďalej zapisuje leady do Sheetu — nič sa nestratí, len sa nebude odosielať e-mail. Pri obnovení nezabudnite na historické riadky (`SKIP`).

---

## 5. Zmeny a verziovanie

- Pred každou zmenou workflowu si stiahnite export JSON a uložte ho s verziou v názve.
- Zmeny róbte po jednom logickom celku a po každom otestujte.
- Do popisu workflowu (Notes) píšte verziu a dátum.
- Ak prevádzkujete viac firiem, veďte si prehľad, ktorá verzia patrí ktorej inštancii.

---

## 6. Eskalácia

| Situácia | Kto rieši | Kedy |
|---|---|---|
| Bežná chyba jedného behu | operátor | do 1 hodiny |
| Výpadok SMTP | správca servera / poskytovateľ | do 1 hodiny |
| Zmena štruktúry Sheetu | správca automatizácie | do 24 hodín |
| Podozrenie na únik osobných údajov | zodpovedná osoba (GDPR) | okamžite |

Kontakty a zodpovednosti si doplňte do svojej internej dokumentácie — nepatria do verejného repozitára.
