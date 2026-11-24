# Bezpečnosť a ochrana osobných údajov

> Praktické zásady pre prevádzku riešenia, ktoré pracuje s menom, e-mailom a telefónnym číslom. Dokument **nie je právne poradenstvo** — pri pochybnostiach sa obráťte na svojho právnika alebo zodpovednú osobu (DPO).

---

## 1. Aké údaje riešenie spracúva

| Údaj | Zdroj | Účel | Uloženie |
|---|---|---|---|
| Meno | Meta Instant Form | oslovenie v e-maile | Google Sheet, e-mail, Telegram |
| E-mail | Meta Instant Form | odpoveď na dopyt | Google Sheet, e-mail, Telegram |
| Telefón | Meta Instant Form | kontakt operátora | Google Sheet, Telegram, `tel:` odkaz |
| Odpovede z formulára | Meta Instant Form | kontext pre hovor | Google Sheet, Telegram |
| Stav a čas odoslania | workflow | prevádzková evidencia | Google Sheet |

**Nespracúvajte** údaje, ktoré na splnenie účelu nepotrebujete. Ak formulár zbiera citlivé údaje (zdravie, náboženstvo, biometria), konzultujte to vopred — mení sa právny základ aj zabezpečenie.

---

## 2. Právny základ a informovanie

- Dopyt z formulára je **aktívny kontakt** — osoba očakáva odpoveď. To je spravidla najsilnejší základ na jednorazovú transakčnú odpoveď.
- V e-maili uveďte, kto správu posiela (firma, kontakt).
- Ak plánujete ďalší marketing (newsletter, ponuky), potrebujete samostatný súhlas. Transakčná odpoveď a marketing nie sú to isté.
- Zásady ochrany osobných údajov mali by byť dostupné na webe firmy a mali by pokrývať spracovanie leadov.

---

## 3. Prístupy

### 3.1 Princíp minimálnych práv

| Systém | Kto má prístup | Poznámka |
|---|---|---|
| Google Sheet | len ľudia, ktorí leady riešia | zdieľať konkrétnym účtom, nie verejným odkazom |
| n8n | správca automatizácie + prevádzka | používať mená a silné heslá, ideálne 2FA |
| SMTP schránka | prevádzka | zdielané heslo meniť pri odchode človeka |
| Telegram kanál | obchodný tím | bot je admin, prístup riadiť |
| Repozitár | vývojár | bez secrets a bez reálnych dát |

### 3.2 Zásady

- Každý človek má **vlastný účet**, žiadne zdieľané prihlásenia.
- Pri odchode človeka: odobrať prístup, zmeniť zdieľané heslá, skontrolovať históriu.
- Prístup k Sheetu je zároveň prístup k osobným údajom — nezvýhodňujte ho „len na čítanie" bez potreby.

---

## 4. Secrets

- SMTP heslo, Telegram token, Google OAuth — **iba v n8n credentials** (šifrované).
- Nikdy ich neukladajte do JSON exportu, do repozitára, do dokumentácie ani do chatu.
- `.env` súbory (ak ich používate) musia byť v `.gitignore`.
- Pri podozrení na únik: okamžite zmeniť heslo/token a skontrolovať históriu odoslaných správ.

---

## 5. Retencia (doba uchovávania)

| Dátum | Odporúčanie |
|---|---|
| Leady v Sheete | podľa interného pravidla (napr. 12–24 mesiacov od posledného kontaktu) |
| História exekúcií n8n | 14–30 dní |
| BCC kópia e-mailov | podľa potreby kontroly, nie trvalo |
| Telegram história | nastaviť automatické mazanie v kanáli, ak je to vhodné |
| Zálohy | šifrované, s vlastnou dobou uchovania |

Za nastavenie retencie zodpovedá prevádzkovateľ. Riešenie samo údaje nemaže — mazanie riadkov a exekúcií je manuálna alebo plánovaná úloha.

---

## 6. Prenos údajov tretím stranám

Riešenie využíva tieto služby:

| Služba | Účel | Kde sú dáta |
|---|---|---|
| Meta | zber leadov | Meta servery + Google Sheet |
| Google | ukladanie Sheetu | Google Cloud |
| poskytovateľ SMTP | doručenie e-mailu | jeho servery |
| Telegram | prevádzkové notifikácie | Telegram servery |

Pri každej službe overte, že máte uzavretú zmluvu o spracovaní (DPA) alebo že prevádzka spadá pod jej podmienky. Ak firma pôsobí v EÚ, overte prenos mimo EÚ a prípadné záruky.

> Notifikácie cez Telegram obsahujú meno, e-mail a telefón. Ak to pre vás nie je prijateľné, nahraďte Telegram e-mailom alebo interným kanálom.

---

## 7. Bezpečnosť repozitára

Do verejného repozitára **nikdy nepatrí**:

- `.env`, heslá, tokeny, API kľúče,
- exporty exekúcií (obsahujú celé telá e-mailov a kontakty),
- screenshoty Sheetu alebo Telegramu s reálnymi údajmi,
- zálohy databázy n8n,
- konfigurácia s reálnym `chat_id`, `SHEET_ID` a e-mailmi (používajte zástupné hodnoty).

Pred zverejnením spustite kontrolu:

```bash
git grep -n -i -E "(password|secret|token|api[_-]?key|@gmail\.com|@[a-z0-9.-]+\.sk)" -- . ':!*.md'
```

> Tento príkaz je orientačný — vždy prejdite zmeny aj očami.

---

## 8. Bezpečnosť e-mailu

- Neodosielajte v e-maile viac údajov, než je potrebné (meno stačí).
- Nepridávajte prílohy s citlivými údajmi.
- Nepoužívajte `noreply@` adresu — klient musí mať možnosť odpovedať.
- BCC kópia je interná — nesmie sa stať verejným archívom.
- Pri podpise zvážte, či uvádzate celú adresu sídla; pri malých firmách to býva štandard.

---

## 9. Incident — podozrenie na únik

1. **Zastavte** workflow (Deactivate).
2. Zistite rozsah: ktoré údaje, ktoré obdobie, ktoré osoby.
3. Zmeňte prístupy: SMTP heslo, Telegram token, Google OAuth, zdieľanie Sheetu.
4. Skontrolujte, či nedošlo k odoslaniu e-mailov na nesprávne adresy.
5. Zaznamenajte priebeh a prijaté opatrenia.
6. Ak ide o závažný incident, postupujte podľa interného procesu a prípadne informujte dotknuté osoby a úrad (podľa platnej legislatívy).

---

## 10. Kontrolný zoznam pred produkciou

- [ ] Prístupy má iba potrebný okruh ľudí.
- [ ] Všetky heslá a tokeny sú v n8n, nie v repozitári.
- [ ] Repozitár neobsahuje reálne dáta (`git grep` kontrola).
- [ ] Je nastavená retencia Sheetu a histórie exekúcií.
- [ ] Klient/prevádzkovateľ pozná tok údajov a súhlasí s ním.
- [ ] BCC schránka je zabezpečená a prístup má len prevádzka.
- [ ] Je známy postup pri incidente.
