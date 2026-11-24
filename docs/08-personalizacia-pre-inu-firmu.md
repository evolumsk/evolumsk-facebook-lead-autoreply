# Personalizácia pre inú firmu

> Praktický checklist, ako z jednej šablóny spraviť riešenie pre konkrétnu firmu — bez zásahu do overenej logiky. Určené agentúram, freelancerom a interným správcom automatizácií.

Základné pravidlo: **logika je spoločná, mení sa iba „vrstva značky"**. Ak zmeníte jadro (filtrovanie, deduplikáciu, stavy), prídete o výhody otestovaného riešenia.

---

## 1. Čo je jadro a čo vrstva

| Vrstva | Príklady | Mení sa? |
|---|---|---|
| **Jadro** | 5-minútový cyklus, 10-minútová brzda, deduplikácia, zámok `PROCESSING`, `Retry On Fail = OFF` | nie |
| **Mapovanie** | názvy stĺpcov, ID Sheetu, `chat_id` | áno, vždy |
| **Komunikácia** | texty e-mailu, podpis, farba, časy hovorov | áno, podľa značky |
| **Notifikácie** | text Telegram správ, príjemca | áno, podľa tímu |
| **Prevádzka** | priečinok BCC, DNS, zálohy | áno, podľa infraštruktúry |

---

## 2. Checklist personalizácie

### 2.1 Povinné (inak workflow nefunguje)

- [ ] `[[SHEET_ID]]` a `[[SHEET_NAME]]` — cieľový Sheet.
- [ ] `[[STLPEC_*]]` — presné názvy stĺpcov z hlavičky.
- [ ] `[[TELEGRAM_CHAT_ID]]` — cieľ notifikácií.
- [ ] SMTP credential a `[[EMAIL_FIRMY]]` — odosielateľ.
- [ ] `[[BCC_EMAIL]]` — kópia odoslaných e-mailov.
- [ ] Časové pásmo workflowu + výrazy `sent_at`.
- [ ] `countryCode` v Code uzloch, ak firma nepôsobí v SR.

### 2.2 Odporúčané (inak pôsobí neosobne)

- [ ] `[[NAZOV_FIRMY]]`, `[[MENO_ODOSIELATELA]]`, `[[POZICIA_ODOSIELATELA]]`.
- [ ] `[[TELEFON_DISPLAY]]`, `[[TELEFON_TEL]]`, `[[WEB_FIRMY]]`, `[[ADRESA_FIRMY]]`.
- [ ] `[[TEMA_DOPYTU]]` — čoho sa dopyt týka (napr. „webových služieb", „rekonštrukcie").
- [ ] Predmet e-mailu v uzle `Send Follow-up Email`.
- [ ] Texty v Telegram notifikáciách (názov firmy, tón).
- [ ] `[[FARBA_ZNACKY]]` — hex farba z vizuálu firmy.

### 2.3 Voliteľné (podľa vyspelosti firmy)

- [ ] Tri časy hovoru podľa otváracích hodín.
- [ ] Podpis s IČO/DIČ alebo bez nich.
- [ ] Odkaz na cenník, portfólio alebo rezervačný formulár.
- [ ] Notifikácia aj na e-mail (druhý kanál).
- [ ] Kópia leadu do CRM.

---

## 3. Texty podľa odvetvia

Nižšie sú vzory, ktoré môžete vložiť do úvodu e-mailu (`[[TEMA_DOPYTU]]` a prvý odsek). Všetky dodržiavajú rovnakú štruktúru: **poďakovanie → konkrétna otázka → voľba času → možnosť odpísať**.

### 3.1 Webová agentúra

```text
ďakujem za Váš dopyt ohľadom webových služieb. Nechcem Vás rušiť počas práce –
kedy by Vám v pracovné dni ideálne vyhovovalo krátko si zavolať?
```

### 3.2 Stavebná firma / rekonštrukcie

```text
ďakujem za Váš dopyt ohľadom rekonštrukcie. Aby sme Vám vedeli dať realistickú
predstavu o cenách a termínoch, radi by sme si krátko zavolali – kedy Vám to vyhovuje?
```

### 3.3 Klinika / zdravotnícke zariadenie

```text
ďakujem za Váš záujem o naše služby. Radi by sme Vám poradili čo najpresnejšie –
kedy by Vám vyhovoval krátky telefonát s naším tímom?
```

> Pri zdravotníctve nedávajte do e-mailu zdravotné údaje ani diagnózy. Odkazujte iba na všeobecnú konzultáciu.

### 3.4 Právna kancelária

```text
ďakujem za Váš dopyt. Každý prípad posudzujeme individuálne – radi by sme si
krátko zavolali a zistili základné súvislosti. Kedy by Vám to vyhovovalo?
```

### 3.5 Nehnuteľnosti

```text
ďakujem za Váš dopyt ohľadom nehnuteľnosti. Radi by sme poznali Vaše preferencie
a ukázali Vám vhodné možnosti – kedy by Vám vyhovoval krátky hovor?
```

### 3.6 Vzdelávanie / kurzy

```text
ďakujem za Váš záujem o kurz. Aby sme Vám odporučili správnu úroveň a formát,
radi by sme si krátko zavolali – kedy Vám to vyhovuje?
```

---

## 4. Časy hovorov podľa typu firmy

| Typ firmy | Odporúčané sloty | Poznámka |
|---|---|---|
| B2B služby | 09:00 – 11:00, 13:00 – 15:00, 16:00 – 18:00 | kopíruje pracovný deň |
| Agentúra / kreatíva | 10:00 – 12:00, 13:00 – 17:00, 17:00 – 19:00 | klienti riešia aj po práci |
| Remeslá / stavby | 07:00 – 09:00, 16:00 – 18:00, 18:00 – 20:00 | mimo času na stavbe |
| Klinika | 08:00 – 10:00, 12:00 – 14:00, 15:00 – 17:00 | medzi ordinačnými hodinami |
| E-shop / podpora | 09:00 – 12:00, 12:00 – 15:00, 15:00 – 18:00 | plynulé pokrytie dňa |

> Čím menej možností, tým vyššia konverzia. Tri sú optimum; viac spôsobuje rozhodovaciu paralýzu.

---

## 5. Vizuál a tón

### 5.1 Farba

- Vyberte jednu sýtu farbu z loga alebo webu.
- Musí mať dobrý kontrast voči bielemu aj tmavému pozadiu.
- Svetlé pastely v dark mode splývajú — vyhýbajte sa im.

### 5.2 Tón

| Odvetvie | Tón | Príklad |
|---|---|---|
| B2B / právo / financie | formálny, vecný | „dovoľujeme si Vás kontaktovať" |
| Kreatíva / marketing | priateľský, ale profesionálny | „ďakujem, že ste si našli čas" |
| Remeslá | priamy, konkrétny | „ozvite sa, dohodneme termín" |
| Zdravotníctvo | upokojujúci, diskrétny | „radi Vám poradíme" |

### 5.3 Čo držať konštantné

- Rovnaký podpis vo všetkých e-mailoch.
- Rovnaké oslovenie (vykanie vs. tykanie) v celej komunikácii.
- Rovnaký názov firmy v e-maile, Telegrame aj Sheete.

---

## 6. Viac značiek alebo kampaní

### 6.1 Odporúčaný model

**Jedna značka = jeden Sheet + jedna kópia workflowu.** Je to najjednoduchšie na údržbu a izoluje chyby.

### 6.2 Viac kampaní pre jednu firmu

Ak majú všetky kampane rovnaký formulár a rovnaké stĺpce, stačí jeden workflow — Meta zapisuje všetky leady do jedného Sheetu. Ak sa líšia (iné otázky), použite samostatný Sheet alebo samostatný workflow.

### 6.3 Viac jazykov

- Samostatný workflow pre každý jazyk (najjednoduchšie), alebo
- vetva `Switch` podľa stĺpca `language` (náročnejšie na údržbu).

> Pri viacjazyčnom riešení nezabudnite na `mailto:` texty — každý jazyk potrebuje vlastné URL-enkódované telo.

---

## 7. Čo nemeniť

- **Frekvenciu 5 minút** — 10-minútová brzda je nastavená na toto okno. Pri zmene cyklu prepočítajte oneskorenie.
- **Poradie zápisu stavov** — `PROCESSING` musí byť pred e-mailom, `SENT` až po ňom.
- **`Retry On Fail = OFF`** pri odosielaní e-mailu.
- **Deduplikáciu podľa e-mailu** — bez nej hrozí spam pri opakovanom vyplnení.
- **Escapovanie pre Telegram** — bez neho padá na `<`, `>`, `&`.
- **Štruktúru stavov** — iné hodnoty než `PROCESSING`, `SENT`, `DUPLICATE_SKIPPED`, `SKIP` workflow nespracuje.

---

## 8. Test personalizácie

Po každej úprave prejdite aspoň:

- [ ] Testovací lead s vlastnou adresou → e-mail dorazil, text sedí.
- [ ] Všetky tri tlačidlá otvoria správnu správu v správnom jazyku.
- [ ] Podpis obsahuje správne údaje (firma, meno, telefón, web).
- [ ] Farba a kontrast sú správne aj v dark mode.
- [ ] Telegram správy majú správny názov firmy a čitateľný formát.
- [ ] Sheet zapísal `SENT` a `sent_at`.
- [ ] Duplicita je označená ako `DUPLICATE_SKIPPED`.
- [ ] Error workflow pošle notifikáciu.

Kompletný protokol: [`07-qa-checklist.md`](07-qa-checklist.md).

---

## 9. Odovzdanie klientovi

Ak riešenie nasadzujete pre klienta, odovzdajte:

1. Tento balík bez vyplnených hodnôt (šablóna).
2. Vyplnenú konfiguráciu **mimo repozitára** (bezpečný priestor, nie e-mail).
3. Krátky manuál „čo robiť, keď nepríde e-mail" (odkaz na [`06-prevadzka-a-incidenty.md`](06-prevadzka-a-incidenty.md)).
4. Zoznam kontaktov na eskaláciu.
5. Potvrdenie, že klient súhlasí so spracovaním osobných údajov v zmysle [zásad ochrany údajov](09-bezpecnost-a-sukromie.md).

Nikdy neodovzdávajte prístupové heslá v texte e-mailu ani v chate.
