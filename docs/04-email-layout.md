# E-mailový layout a doručiteľnosť

> Ako je postavený e-mail, prečo vyzerá minimalisticky, ako ho prispôsobiť a ako zabezpečiť, aby skončil v priečinku **Hlavná**, nie v Spame či Reklamách.

Súbor na úpravu: [`templates/email-layout.html`](../templates/email-layout.html). Rovnaké HTML je vložené v uzle `Send Follow-up Email`.

---

## 1. Cieľ e-mailu

E-mail nie je marketingový newsletter. Je to **transakčná odpoveď na aktívny dopyt**. Tomu zodpovedá dizajn:

- žiadne obrázky, logá ani externé fonty,
- žiadna marketingová pätička s odhlásením,
- biele pozadie, systémové písmo, krátke odseky,
- tri jasné akcie (výber času hovoru),
- jeden podpis s kontaktom.

Tento prístup výrazne zvyšuje šancu na doručenie do **Gmail Primary** a znižuje riziko označenia za reklamu.

---

## 2. Štruktúra

```text
Dobrý deň [meno],

ďakujem za Váš dopyt ohľadom [téma dopytu]. Nechcem Vás rušiť počas práce –
kedy by Vám v pracovné dni ideálne vyhovovalo krátko si zavolať?
Stačí kliknúť na vyhovujúci čas nižšie:

[ 10:00 – 12:00 ]  [ 13:00 – 17:00 ]  [ 17:00 – 19:00 ]

Na tento e-mail môžete pokojne aj rovno odpísať. Ak už máte určitú predstavu
o projekte, stručne ju popíšte a priložte aj odkazy…

Zastihnete ma tiež kedykoľvek počas pracovných dní na čísle [telefón].

S pozdravom
[Meno] | [Firma]
[Pozícia]
[telefón] | [e-mail]
[adresa] | [web]
```

---

## 3. Zástupné hodnoty v e-maile

| Zástupná hodnota | Kde sa zobrazí |
|---|---|
| `[[NAZOV_FIRMY]]` | podpis |
| `[[MENO_ODOSIELATELA]]` | podpis |
| `[[POZICIA_ODOSIELATELA]]` | podpis |
| `[[EMAIL_FIRMY]]` | `mailto:` odkazy, podpis, `Reply-To` |
| `[[TELEFON_DISPLAY]]` | text `tel:` odkazu a podpis |
| `[[TELEFON_TEL]]` | `href="tel:…"` |
| `[[WEB_FIRMY]]` | text a `href` v podpise |
| `[[ADRESA_FIRMY]]` | podpis |
| `[[TEMA_DOPYTU]]` | úvodná veta (napr. „webových služieb") |
| `[[FARBA_ZNACKY]]` | farba tlačidiel a odkazov (hex) |

Oslovenie menom nie je zástupná hodnota — dopĺňa ho n8n výrazom:

```text
{{ $('Prepare Lead Data').item.json.greeting_html }}
```

Tento výraz vráti buď ` Ján`, alebo prázdny reťazec. Nikdy nevypíše `undefined`.

---

## 4. Ako upraviť texty

### 4.1 Úvodná veta

V HTML nájdite odsek začínajúci `ďakujem za Váš dopyt` a upravte ho. Držte sa týchto pravidiel:

- krátke vety, žiadne superlatívy,
- vykanie a osobnejší tón,
- žiadne „automatická odpoveď", „robot", „systém",
- jedna jasná otázka alebo výzva.

### 4.2 Tlačidlá a časy

Tlačidlá sú tri odkazy `mailto:` s predvyplneným predmetom a telom. Ak chcete iné časy:

1. Zmeňte text medzi `<a …>` a `</a>` (napr. `09:00 – 11:00`).
2. Zmeňte `subject` a `body` v `href` — **a URL-enkódujte ich**.
3. Skontrolujte, že odkazy majú správny príjemca `[[EMAIL_FIRMY]]`.

### 4.3 URL-enkódovanie

Diakritika, medzery a zalomenia riadkov musia byť zakódované. Najjednoduchší spôsob je konzola v prehliadači (F12):

```javascript
encodeURIComponent('Hovor k Vášmu projektu (10:00 - 12:00)')
// Hovor%20k%20V%C3%A1%C5%A1mu%20projektu%20(10%3A00%20-%2012%3A00)

encodeURIComponent('Dobrý deň,\n\nnajlepšie mi vyhovuje hovor v pracovné dni medzi 10:00 a 12:00.')
// Dobr%C3%BD%20de%C5%88%2C%0A%0Anajlep%C5%A1ie…
```

Výsledok vložte za `?subject=` a `&body=`.

> **Tip:** `encodeURIComponent` nezakóduje zátvorky. V `mailto:` sú povolené, ale ak chcete maximálnu kompatibilitu, zakódujte ich ručne ako `%28`, `%29`.

### 4.4 Predmet e-mailu

Predmet je v uzle `Send Follow-up Email`, nie v HTML. Predvolená hodnota:

```text
Ďakujem za Váš dopyt – kedy si môžeme krátko zavolať?
```

Držte ho krátky (do 60 znakov), bez emoji a bez „RE:".

---

## 5. Dark mode

Tlačidlá nesmú byť čierne na priehľadnom pozadí — v tmavom režime splynú s pozadím. Šablóna preto používa:

- `background-color` = `[[FARBA_ZNACKY]]`,
- `border: 1px solid [[FARBA_ZNACKY]]`,
- `color: #ffffff`,
- `border-radius: 8px`.

Ak meníte farbu, vyberte dostatočne sýtu farbu s dobrým kontrastom voči bielemu aj tmavému pozadiu.

---

## 6. Doručiteľnosť — praktický checklist

### 6.1 DNS

- [ ] **SPF** obsahuje IP servera, cez ktorý odosielate.
- [ ] **DKIM** je aktívny a podpis je publikovaný.
- [ ] **DMARC** existuje (`_dmarc.vasadomena.sk`), ideálne `p=quarantine`.
- [ ] **PTR** IP adresy smeruje na hostname mailservera.
- [ ] Doména odosielateľa nie je na blacklistoch (overte napr. cez MXToolbox).

### 6.2 Obsah

- [ ] Žiadne obrázky ani logá.
- [ ] Žiadne externé fonty a skripty.
- [ ] Žiadne sledovacie pixely.
- [ ] Žiadne „Kliknite sem", „Akcia končí dnes".
- [ ] Maximálne 5 odkazov (3 tlačidlá + telefón + web).
- [ ] Text a HTML verzia nie sú v konflikte (n8n posiela HTML; textová alternatíva nie je podmienkou).

### 6.3 Technika

- [ ] `From` adresa sa zhoduje s doménou, ktorá má DKIM.
- [ ] `Reply-To` je reálna a monitorovaná schránka.
- [ ] `BCC` je nastavené (kópia pre kontrolu).
- [ ] `Append n8n Attribution` je vypnuté.
- [ ] `Retry On Fail` je vypnuté.

### 6.4 Prvý test

Odošlite e-mail na vlastnú Gmail adresu a skontrolujte:

- priečinok **Hlavná** (nie Reklamy),
- zobrazenie na mobile aj desktope,
- že sa tlačidlá naozaj otvoria,
- že diakritika v predvyplnenej správe je správna.

---

## 7. Kópia odoslaných e-mailov (BCC + filter)

SMTP neukladá odoslané správy do IMAP priečinka *Sent*. Prehľad preto riešte kópiou:

1. V uzle `Send Follow-up Email` nastavte **BCC** na `[[BCC_EMAIL]]` (napr. `odoslane@vasa-firma.sk`).
2. V schránke vytvorte filter (Sieve / pravidlo):
   - podmienka: predmet obsahuje `dopyt`,
   - akcia: presunúť do priečinka `Automatické odpovede`.
3. Výsledok: každý odoslaný e-mail máte okamžite v schránke vrátane doplneného mena.

> Ak BCC nechcete, odstráňte ho z uzla. Bez BCC stratíte kontrolu nad tým, čo presne odišlo.

---

## 8. Podpis a právne minimum

Podpis by mal obsahovať:

- obchodné meno (alebo značku),
- adresu sídla (ak ju uvádzate v obchodnej komunikácii),
- kontaktný e-mail a telefón,
- web.

Odhlásenie (unsubscribe) pri transakčnej odpovedi na vlastný dopyt nie je potrebné. Ak však e-mail posielate ako súčasť hromadnej komunikácie, právne požiadavky sa menia — vtedy sa poraďte s právnikom.

---

## 9. Náhľad a ladenie

1. Otvorte `templates/email-layout.html` v prehliadači — uvidíte rozloženie (n8n výrazy zostanú ako text).
2. Po vložení do uzla `Send Follow-up Email` odošlite testovací e-mail.
3. Pri úprave HTML v n8n dbajte na to, že pole je v **Expression** režime (začína `=`), pretože obsahuje `{{ … }}`.
4. Ak vkladáte čisté HTML bez výrazov, `=` na začiatku nie je potrebné.

> Pri každej zmene textu znova otestujte doručenie do Gmailu. Zmena jednej vety môže zmeniť klasifikáciu.

---

## 10. Čo nikdy nerobiť

- Nepridávajte logo ako obrázok „len do podpisu" — zvyšuje riziko Reklám.
- Nepoužívajte skrátené odkazy (bit.ly a pod.).
- Neposielajte e-mail z „noreply@" adresy.
- Nedávajte do predmetu slová ako „ZADARMO", „AKCIA", „POSLEDNÁ ŠANCA".
- Nemiešajte viac jazykov v jednom e-maile bez vetvenia.
- Neposielajte testovacie e-maily na reálne leady.
- Nemeňte `From` adresu na doménu, ktorú nemáte overenú cez SPF/DKIM.
