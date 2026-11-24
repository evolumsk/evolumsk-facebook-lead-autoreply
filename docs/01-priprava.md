# Príprava prostredia a prístupov

> Všetko, čo musí existovať **pred** importom workflowu: n8n, Google prístup, Meta synchronizácia, SMTP, Telegram a DNS. Bez týchto krokov sa workflow nespustí správne.

Obsahuje aj **zoznam zástupných hodnôt** `[[…]]`, ktoré budete nahrádzať.

---

## 1. n8n inštancia

### 1.1 Požiadavky

| Parameter | Požiadavka |
|---|---|
| Verzia | n8n 1.x (exportované z verzie s `googleSheets` 4.7, `emailSend` 2.1, `telegram` 1.2) |
| Typ | self-hosted alebo n8n Cloud |
| Práva | vytváranie credentials, aktivácia workflowov, prístup k Executions |
| Časové pásmo | nastavené v **Settings → Timezone** (šablóna predvolene `Europe/Bratislava`) |
| Úložisko | dosť miesta na históriu exekúcií (odporúčame 14–30 dní) |

### 1.2 Odporúčané nastavenia

- **Executions → Save successful executions:** zapnuté aspoň počas prvých dvoch týždňov.
- **Executions → Save failed executions:** vždy zapnuté.
- **Prune executions:** po stabilizácii nastavte 14–30 dní.
- Ak inštancia beží na viacerých workeroch, obmedzte súbežnosť exekúcií (viď [architektúra](03-architektura-workflowu.md#6-súbežnosť-a-prečo-je-bezpečná)).

---

## 2. Google Sheets

### 2.1 Oprávnenia

Workflow potrebuje účet, ktorý má k cieľovému Sheetu aspoň právo **Editor** (zápis stavov). Ak Sheet vlastní iná osoba, zdieľajte ho s účtom, ktorý budete používať v n8n.

### 2.2 Vytvorenie credentialu v n8n

1. **Credentials → New → Google Sheets OAuth2 API**.
2. Postupujte podľa sprievodcu v n8n (Google Cloud projekt, OAuth consent screen, OAuth client).
3. Povolený scope: `https://www.googleapis.com/auth/spreadsheets`.
4. Po prihlásení overte, že credential je v stave **Connected**.

> Credential nikdy nekopírujte do repozitára. V JSON šablóne sú `credentials` bloky zámerne odstránené — priradíte ich v UI.

### 2.3 Zistenie ID dokumentu

ID je reťazec v URL:

```text
https://docs.google.com/spreadsheets/d/<<< SHEET_ID >>>/edit
```

Tento reťazec patrí do zástupnej hodnoty `[[SHEET_ID]]`.

---

## 3. Meta Instant Form → Google Sheets

Toto je **jediná väzba na Metu** a nastavuje sa mimo n8n. n8n ju neimplementuje a nepotrebuje žiadny Meta token.

1. V **Meta Ads Manageri** otvorte formulár pre leady (*Instant Form*).
2. V nastaveniach formulára zvoľte **Synchronizácia leadov → Google Sheets**.
3. Prihláste sa účtom, ktorý Sheet vlastní, a vyberte dokument a hárok.
4. Odošlite testovací lead cez **Lead Ads Testing Tool** (`developers.facebook.com/tools/lead-ads-testing`).
5. Skontrolujte, že Meta zapísala nový riadok na **koniec** hárku a aké presné názvy stĺpcov použila.

> Názvy stĺpcov, ktoré vytvorí Meta, sa líšia podľa jazyka účtu (napr. `full_name` vs. `celé_jméno`, `email` vs. `e-mail`). Presné názvy si poznačte — idú do konfigurácie uzlov `Filter & Deduplicate Leads` a `Prepare Lead Data`.

### 3.1 Čo Meta do Sheetu neposiela

- Váš stav odoslania — ten si pridáte ako technické stĺpce.
- Poznámky operátora — tie si pridáte tiež.

Technické stĺpce patria **úplne vpravo**, nikdy medzi stĺpce Metay. Detaily: [`05-google-sheet.md`](05-google-sheet.md).

---

## 4. SMTP (odosielanie e-mailov)

### 4.1 Čo potrebujete od poskytovateľa

| Parameter | Príklad | Poznámka |
|---|---|---|
| Host | `mail.vasa-firma.sk` | často `smtp.` alebo `mail.` |
| Port | `465` (SSL/TLS) alebo `587` (STARTTLS) | overte u poskytovateľa |
| Šifrovanie | SSL/TLS alebo STARTTLS | nie „žiadne" |
| Používateľské meno | `info@vasa-firma.sk` | celá adresa |
| Heslo | — | ideálne aplikačné heslo, ak ho poskytovateľ podporuje |

### 4.2 Vytvorenie credentialu v n8n

1. **Credentials → New → SMTP**.
2. Vyplňte host, port, šifrovanie, používateľa a heslo.
3. Uložte a odošlite testovací e-mail na vlastnú adresu (cez akýkoľvek e-mailový klient alebo dočasný uzol).
4. Až keď test prejde, pokračujte.

### 4.3 Doručiteľnosť (DNS)

Pre doménu odosielateľa overte:

- **SPF** — obsahuje server, cez ktorý sa odosiela.
- **DKIM** — aktívny a publikovaný v DNS.
- **DMARC** — aspoň `p=none` s reportovaním, ideálne `p=quarantine`.
- **PTR (reverse DNS)** — IP servera smeruje na hostname mailservera.

Bez týchto záznamov môže e-mail skončiť v Spame alebo v Reklamách. Riešeniu sa venuje [`04-email-layout.md`](04-email-layout.md).

---

## 5. Telegram

### 5.1 Vytvorenie bota

1. V Telegrame otvorte `@BotFather`.
2. Príkaz `/newbot` → názov → používateľské meno končiace na `bot`.
3. Uložte token — **nikdy ho nevkladajte do repozitára**, patrí iba do n8n credentialu.

### 5.2 Cieľový chat

- **Súkromný chat:** botovi napíšte `/start`. `chat_id` zistíte cez `https://api.telegram.org/bot<TOKEN>/getUpdates` (pole `message.chat.id`).
- **Kanál:** pridajte bota ako **administrátora** s právom pridávať príspevky. `chat_id` kanála začína `-100…` a zistíte ho z `channel_post.chat.id`.

### 5.3 Credential v n8n

1. **Credentials → New → Telegram API**.
2. Vložte token.
3. Otestujte odoslaním jednoduchej správy do cieľového chatu.

`chat_id` patrí do zástupnej hodnoty `[[TELEGRAM_CHAT_ID]]` (v hlavnom aj error workflowe).

---

## 6. Zoznam zástupných hodnôt

Všetky hodnoty sú v tvare `[[NAZOV]]`. Nahrádzajte ich **pred importom** (alebo po importe priamo v uzloch).

### 6.1 Google Sheet a stĺpce

| Zástupná hodnota | Význam | Príklad |
|---|---|---|
| `[[SHEET_ID]]` | ID Google Sheetu | `1AbCdEfGh…` |
| `[[SHEET_NAME]]` | názov hárku (len popis v uzloch) | `Leady` |
| `[[STLPEC_ID]]` | stĺpec s unikátnym ID leadu | `id` |
| `[[STLPEC_CAS]]` | stĺpec s časom vytvorenia | `created_time` |
| `[[STLPEC_MENO]]` | stĺpec s menom | `full_name` |
| `[[STLPEC_EMAIL]]` | stĺpec s e-mailom | `email` |
| `[[STLPEC_TELEFON]]` | stĺpec s telefónom | `phone_number` |
| `[[STLPEC_SLUZBA]]` | stĺpec s vlastnou otázkou č. 1 | `sluzba` |
| `[[STLPEC_ROZPOCET]]` | stĺpec s vlastnou otázkou č. 2 | `rozpocet` |
| `[[STLPEC_STAV]]` | technický stĺpec stavu | `email_status` |
| `[[STLPEC_ODOSLANE]]` | technický stĺpec času odoslania | `sent_at` |

> Ak ste technické stĺpce pomenovali inak, nahraďte aj `[[STLPEC_STAV]]` a `[[STLPEC_ODOSLANE]]`. Musia sa zhodovať s hlavičkou Sheetu.

### 6.2 Odosielateľ a značka

| Zástupná hodnota | Význam | Príklad |
|---|---|---|
| `[[NAZOV_FIRMY]]` | obchodné meno / značka | `Vaša firma s.r.o.` |
| `[[MENO_ODOSIELATELA]]` | meno odosielateľa | `Ján Novák` |
| `[[POZICIA_ODOSIELATELA]]` | pozícia / popis | `Konateľ • Špecialista na web` |
| `[[EMAIL_FIRMY]]` | e-mail odosielateľa | `info@vasa-firma.sk` |
| `[[TELEFON_DISPLAY]]` | telefón na zobrazenie | `+421 900 000 000` |
| `[[TELEFON_TEL]]` | telefón pre `tel:` odkaz | `+421900000000` |
| `[[WEB_FIRMY]]` | webová stránka | `https://vasa-firma.sk` |
| `[[ADRESA_FIRMY]]` | adresa v podpise | `Ulica 1, Mesto` |
| `[[BCC_EMAIL]]` | skrytá kópia odoslaných e-mailov | `odoslane@vasa-firma.sk` |
| `[[TEMA_DOPYTU]]` | téma dopytu v úvode e-mailu | `webových služieb` |
| `[[FARBA_ZNACKY]]` | hex farba tlačidiel | `#1A73E8` |
| `[[TELEGRAM_CHAT_ID]]` | ID chatu alebo kanála | `-1001234567890` |

### 6.3 Hodnoty v kóde (majú rozumný predvolený stav)

Tieto nie sú zástupné výrazy, ale konštanty v uzloch `Code`:

| Konštanta | Kde | Predvolené | Kedy meniť |
|---|---|---|---|
| `minAgeMinutes` | `Filter & Deduplicate Leads` | `10` | ak chcete iné oneskorenie (odporúčané 10–15) |
| `countryCode` | oba Code uzly | `421` | ak nie ste zo Slovenska (napr. `420` pre ČR) |
| časové pásmo | Settings + 2× `sent_at` | `Europe/Bratislava` | ak pôsobíte v inom pásme |

---

## 7. Kontrolný zoznam pred importom

- [ ] n8n beží, mám prístup a viem sa prihlásiť.
- [ ] Google Sheets credential je pripojený a vidí cieľový Sheet.
- [ ] Meta zapisuje leady do Sheetu (overené testovacím leadom).
- [ ] Poznám presné názvy stĺpcov z hlavičky Sheetu.
- [ ] SMTP credential funguje (testovací e-mail dorazil).
- [ ] Doména má SPF, DKIM, DMARC; PTR overené.
- [ ] Telegram bot existuje, je admin v cieli a testovacia správa dorazila.
- [ ] Mám vyplnené všetky zástupné hodnoty zo sekcie 6.

Keď je všetko odškrtnuté, pokračujte na [`02-postup-nasadenia.md`](02-postup-nasadenia.md).
