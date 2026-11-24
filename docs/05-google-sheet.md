# Google Sheet — štruktúra a pravidlá

> Google Sheet je jediný zdroj pravdy. Dokument popisuje povinné stĺpce, stavový automat, pravidlá údržby a časté chyby.

Vzorový súbor: [`templates/google-sheet-example.csv`](../templates/google-sheet-example.csv).

---

## 1. Ako Sheet vzniká

Meta Instant Form zapisuje leady do Sheetu **natívne** (mimo n8n) metódou *append* — vždy na koniec tabuľky. Preto:

- poradie a názvy stĺpcov vytvorených Metou sa **nikdy nemenia**,
- nové (technické) stĺpce sa pridávajú **iba úplne vpravo**,
- riadky sa nikdy nevkladajú doprostred.

Workflow číta celý hárok, takže nepotrebuje žiadne filtre ani pomenované rozsahy.

---

## 2. Minimálna štruktúra

| # | Stĺpec | Typ | Kto plní | Povinný |
|---|---|---|---|---|
| 1 | `id` | text | Meta | áno |
| 2 | `created_time` | dátum/čas | Meta | áno |
| 3 | `full_name` | text | Meta | nie |
| 4 | `email` | text | Meta | áno |
| 5 | `phone_number` | text | Meta | nie |
| 6 | `sluzba` | text | Meta (vlastná otázka) | nie |
| 7 | `rozpocet` | text | Meta (vlastná otázka) | nie |
| 8 | `email_status` | text | workflow | áno |
| 9 | `sent_at` | text | workflow | áno |
| 10 | `notes` | text | operátor | nie |

> Názvy stĺpcov 1–7 závisia od jazyka Meta účtu a od formulára. Presné názvy skopírujte z hlavičky a vložte do `CONFIG.columns` v oboch Code uzloch.

### 2.1 Príklad hlavičky

```csv
id,created_time,full_name,email,phone_number,sluzba,rozpocet,email_status,sent_at,notes
```

### 2.2 Príklad riadkov

| id | created_time | full_name | email | phone_number | sluzba | rozpocet | email_status | sent_at | notes |
|---|---|---|---|---|---|---|---|---|---|
| `l:100…001` | `2026-01-15T09:05:00+01:00` | Ján Novák | `jan.novak@example.com` | `p:+421900000001` | Nový web | 1 000 – 3 000 € | `SENT` | `15.01.2026 09:18` | Volané 16.01. |
| `l:100…002` | `2026-01-15T11:40:00+01:00` | Eva Testovacia | `eva.testovacia@example.com` | `p:+421900000002` | Redesign | 500 – 1 000 € | *(prázdne)* | | |
| `l:100…003` | `2026-01-15T12:10:00+01:00` | Peter Ukážka | `peter.ukazka@example.com` | `p:+421900000003` | SEO | do 500 € | `DUPLICATE_SKIPPED` | | rovnaký e-mail |

---

## 3. Stavový automat

| Hodnota | Význam | Kto zapisuje |
|---|---|---|
| *(prázdne)* | nový, nespracovaný lead | Meta |
| `PROCESSING` | zámok pred odoslaním | workflow |
| `SENT` | e-mail odovzdaný SMTP | workflow |
| `DUPLICATE_SKIPPED` | e-mail už raz dostal správu | workflow |
| `SKIP` | historický alebo ručne vyradený | operátor |

### 3.1 Pravidlá

1. Workflow spracuje **iba riadky s prázdnym** `email_status`.
2. `SENT`, `SKIP` a `DUPLICATE_SKIPPED` sú terminálne.
3. `PROCESSING` blokuje ďalšie spracovanie — je to zámer.
4. Nikdy nepíšte do `email_status` iné hodnoty (napr. `sent`, `ok`) — workflow ich nebude rozumieť.

### 3.2 Prepis stavu

Ak potrebujete riadok znova spracovať:

1. Vymažte hodnotu v `email_status` (na prázdno).
2. Uistite sa, že v Sheete neexistuje iný riadok s rovnakým e-mailom v stave `SENT` alebo `PROCESSING`.
3. Workflow ho spracuje v najbližšom cykle.

Pri `PROCESSING` najprv overte, či e-mail reálne odišiel — postup v [`06-prevadzka-a-incidenty.md`](06-prevadzka-a-incidenty.md#31-riadok-zostal-v-processing).

---

## 4. Technické stĺpce

### 4.1 Pridanie

1. Kliknite na prvú prázdnu bunku vpravo od posledného stĺpca.
2. Napíšte hlavičku (`email_status`, `sent_at`, prípadne `notes`).
3. Formát buniek nastavte na **Plain text** (Formát → Číslo → Text), aby Google automaticky nekonvertoval dátumy a čísla.

### 4.2 Formát `sent_at`

Workflow zapisuje `dd.MM.yyyy HH:mm` v časovom pásme workflowu. Ak chcete iný formát, upravte výraz v uzle `Mark Row SENT`:

```text
{{ $now.setZone('Europe/Bratislava').toFormat('yyyy-MM-dd HH:mm') }}
```

> Ak zmeníte časové pásmo vo workflowe, zmeňte ho aj v tomto výraze. Nachádza sa na dvoch miestach (Mark Row SENT a Telegram – Sent).

### 4.3 `notes`

Kolónka pre operátora. Workflow do nej **nikdy nezapisuje**. Používajte ju na výsledok hovoru, dohodnutý ďalší krok a podobne.

---

## 5. Historické riadky pred aktiváciou

Toto je najčastejšia chyba pri nasadení: workflow po aktivácii pošle e-mail všetkým historickým leadom, ktoré majú prázdny stav.

Postup:

1. Zistite, koľko riadkov má prázdny `email_status`.
2. Všetky **historické** riadky označte `SKIP`.
3. Nechajte prázdne iba tie, ktoré chcete reálne spracovať.
4. Skontrolujte aj riadky staršie ako niekoľko mesiacov — patria tiež na `SKIP`.

Rýchly spôsob: do bunky vedľa vložte `SKIP`, skopírujte a rozhoďte na celý rozsah. Alebo použite `ARRAYFORMULA` v dočasnom stĺpci a hodnoty preneste ako hodnoty.

> Ak si nie ste istí, workflow radšej **neaktivujte**. Leady sa dajú obslúžiť telefonicky a stav doplniť neskôr.

---

## 6. Údržba a pravidlá

### 6.1 Mazanie testovacích dát

Vždy **odstráňte celý riadok** (pravý klik na číslo riadku → *Odstrániť riadok*). Nikdy nevyprázdňujte bunky klávesom Delete — vzniknú „diery", ktoré komplikujú ručnú kontrolu aj prípadné reporty.

### 6.2 Zamknutie hlavičky

Odporúčame:

- **Zobraziť → Zmraziť → 1 riadok**,
- ochrana rozsahu hlavičky (Data → Ochrana listov a rozsahov),
- pomenovaný list pre rýchly prehľad.

### 6.3 Prístupy

- Sheet zdieľajte iba s účtom n8n a s ľuďmi, ktorí ho naozaj potrebujú.
- Neposielajte verejné odkazy („anyone with the link").
- Ak pracuje viac ľudí, dohodnite sa, kto smie meniť `email_status`.

### 6.4 Zálohy

- Google Sheet má históriu verzií (Súbor → História verzií).
- Pred väčšími zásahmi (hromadné `SKIP`, mazanie) vytvorte kópiu dokumentu.
- Nezálohujte Sheet do repozitára — obsahuje osobné údaje.

---

## 7. Časté problémy

| Príznak | Príčina | Riešenie |
|---|---|---|
| Workflow nič nespracuje | nesedí názov stĺpca | porovnajte hlavičku s `CONFIG.columns` |
| `Column not found` | technický stĺpec chýba | pridajte `email_status` / `sent_at` |
| Dátum sa neparsuje | bunka má iný formát | nastavte Plain text alebo overte `created_time` |
| Google mení telefón na číslo | automatický formát | nastavte stĺpec na Plain text |
| Riadok sa stále vracia | stav je prázdny, alebo biely znak | skontrolujte, či bunka neobsahuje medzeru |
| Dáta sa „posúvajú" | niekto vložil stĺpec doprostred | obnovte verziu a stĺpce pridávajte len vpravo |

> Ak má bunka v `email_status` neviditeľnú medzeru, workflow ju vyhodnotí ako neprázdnu a riadok preskočí. Pri podozrení použite `=LEN(TRIM(S2))`.
