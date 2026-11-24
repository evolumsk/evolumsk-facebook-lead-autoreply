# Postup nasadenia

> Praktický postup od stiahnutia šablóny po aktívny workflow: nahradenie hodnôt, import, priradenie credentials, konfigurácia uzlov, prvý test a aktivácia.

Predpoklad: máte hotovú [prípravu](01-priprava.md) a poznáte svoje hodnoty.

---

## 1. Pracovná kópia

1. Skopírujte si celý priečinok `templates/` mimo repozitára (napr. na plochu).
2. Vytvorte si vlastný súbor `konfiguracia.md` s vyplnenými hodnotami — budete ich potrebovať pri každej ďalšej úprave:

```text
SHEET_ID:                 
SHEET_NAME:               
STLPEC_ID:               
STLPEC_CAS:              
STLPEC_MENO:             
STLPEC_EMAIL:            
STLPEC_TELEFON:          
STLPEC_SLUZBA:           
STLPEC_ROZPOCET:         
STLPEC_STAV:             
STLPEC_ODOSLANE:         
TELEGRAM_CHAT_ID:        
NAZOV_FIRMY:             
MENO_ODOSIELATELA:       
POZICIA_ODOSIELATELA:    
EMAIL_FIRMY:             
TELEFON_DISPLAY:         
TELEFON_TEL:             
WEB_FIRMY:               
ADRESA_FIRMY:            
BCC_EMAIL:               
TEMA_DOPYTU:             
FARBA_ZNACKY:            
```

> Tento súbor **necommitujte** — obsahuje interné údaje. Do gitu patrí iba šablóna so zástupnými hodnotami.

---

## 2. Nahradenie zástupných hodnôt

Nahrádzajte v týchto súboroch:

- `templates/workflow-meta-leads-email-reply.json`
- `templates/workflow-error-notifier.json`
- `templates/email-layout.html`
- `templates/code-filter-deduplicate.js`
- `templates/code-prepare-lead-data.js`

> Kódy `.js` sú referenčné — rovnaký kód je vložený v JSON. Ak ich upravíte, musíte ho vložiť aj do uzla v n8n (alebo znova vygenerovať JSON).

### 2.1 Poradie nahradenia

1. Stĺpce (`[[STLPEC_*]]`) — najčastejšia príčina chýb.
2. Sheet (`[[SHEET_ID]]`, `[[SHEET_NAME]]`).
3. Identita a kontakty (`[[NAZOV_FIRMY]]`, `[[EMAIL_FIRMY]]`, …).
4. Telegram (`[[TELEGRAM_CHAT_ID]]`).
5. Vizuál (`[[FARBA_ZNACKY]]`, `[[TEMA_DOPYTU]]`).

### 2.2 VS Code (odporúčané)

1. Otvorte priečinok `templates/` vo VS Code.
2. `Ctrl + Shift + H` → Find & Replace v celom priečinku.
3. Pre každú hodnotu: **Replace All**.
4. Na konci vyhľadajte `[[` — nesmie nájsť nič.

### 2.3 PowerShell

```powershell
$map = @{
  '[[SHEET_ID]]'    = '1AbCdEfGh…'
  '[[SHEET_NAME]]'  = 'Leady'
  '[[STLPEC_ID]]'   = 'id'
  # … doplňte zvyšok
}

Get-ChildItem -Path .\templates -Recurse -Include *.json,*.html,*.js | ForEach-Object {
  $path = $_.FullName
  $text = Get-Content -Raw -Encoding utf8 $path
  foreach ($key in $map.Keys) { $text = $text.Replace($key, $map[$key]) }
  Set-Content -NoNewline -Encoding utf8 $path $text
}
```

> Pred spustením si súbory zálohujte. Po nahradení overte, že JSON je stále platný (otvorte ho v editore s kontrolou syntaxe alebo ho importujte do n8n).

### 2.4 Čo sa nestane automaticky

- **Hárok v Google Sheets:** JSON obsahuje iba popisný názov. Po importe vyberte hárok z rozbaľovacieho zoznamu v každom Sheets uzle.
- **Credentials:** JSON ich neobsahuje. Priraďte ich po importe.
- **Error Workflow:** nastavte v **Settings → Error Workflow** ručne.

---

## 3. Import workflowov

1. n8n → **Workflows → Import from File**.
2. Vyberte `workflow-meta-leads-email-reply.json`.
3. Zopakujte pre `workflow-error-notifier.json`.
4. Otvorte hlavný workflow a skontrolujte, že má **14 uzlov**:
   - produkčná vetva: `Every 5 Minutes`, `Get All Leads`, `Filter & Deduplicate Leads`, `Is Ready To Send`, `Mark Duplicate Skipped`, `Lock Row (PROCESSING)`, `Notify Telegram – New Lead`, `Send Follow-up Email`, `Mark Row SENT`, `Notify Telegram – Sent`
   - testovacia vetva: `Force Test (1st Row)`, `Get 1st Row (Force)`, `Limit First Row`
   - spoločný normalizér: `Prepare Lead Data`

> Ak import ohlási chybu „Invalid JSON", pravdepodobne ste pri hromadnom nahradení poškodili úvodzovky alebo ukončenie súboru. Obnovte zálohu a nahradenie zopakujte.

---

## 4. Priradenie credentials

| Uzol | Credential | Poznámka |
|---|---|---|
| `Get All Leads` | Google Sheets OAuth2 API | čítanie |
| `Get 1st Row (Force)` | Google Sheets OAuth2 API | čítanie pre test |
| `Mark Duplicate Skipped` | Google Sheets OAuth2 API | zápis |
| `Lock Row (PROCESSING)` | Google Sheets OAuth2 API | zápis |
| `Mark Row SENT` | Google Sheets OAuth2 API | zápis |
| `Send Follow-up Email` | SMTP | odosielanie |
| `Notify Telegram – New Lead` | Telegram API | notifikácia |
| `Notify Telegram – Sent` | Telegram API | notifikácia |
| `Notify Telegram – Error` (error workflow) | Telegram API | notifikácia |

Po priradení každý uzol otvorte a skontrolujte:

- Google Sheets: **Document** = váš Sheet, **Sheet** = správny hárok.
- Send Email: **From**, **To**, **Subject**, **BCC**, **Reply-To**.
- Telegram: **Chat ID** = `[[TELEGRAM_CHAT_ID]]` (nahradené).

---

## 5. Nastavenia workflowu

V hlavnom workflow otvorte **⋯ → Settings**:

| Nastavenie | Hodnota |
|---|---|
| Timezone | vaše pásmo (predvolene `Europe/Bratislava`) |
| Error Workflow | `Meta Leady – Error Notifier` |
| Save successful executions | zapnuté (aspoň počas ladenia) |
| Save failed executions | zapnuté |
| Execution order | `v1` |

V error workflowe nastavte rovnaké časové pásmo a overte `chat_id`.

---

## 6. Prvý test — odporúčaný postup

### 6.1 Test cez testovaciu vetvu (rýchly)

Vetva `Force Test (1st Row)` obchádza časovú brzdu, stav aj deduplikáciu. Slúži na overenie odosielacej časti bez čakania.

1. Do Sheetu pridajte **testovací riadok** so svojou e-mailovou adresou (nie reálnym leadom).
2. Riadok musí mať vyplnené `id`, `created_time`, meno, e-mail a telefón.
3. V n8n otvorte `Force Test (1st Row)` → **Test step**.
4. Sledujte celú vetvu: `Get 1st Row (Force)` → `Limit First Row` → `Prepare Lead Data` → `Lock Row (PROCESSING)` → Telegram → e-mail → `SENT` → Telegram.

> Testovacia vetva **mení dáta** v Sheete — prvému dátovému riadku prepíše stav na `SENT` a doplní `sent_at`. Preto používajte vlastný testovací riadok.

### 6.2 Test produkčnej vetvy (realistický)

1. Vytvorte testovací lead tak, aby mal `created_time` starší ako 10 minút (alebo upravte bunku).
2. `email_status` nechajte prázdne.
3. Spustite `Every 5 Minutes` → **Test step** (manuálne).
4. `Filter & Deduplicate Leads` musí vrátiť práve 1 položku s `_action = "SEND"`.
5. Po behu skontrolujte `SENT`, `sent_at`, e-mail, BCC a Telegram.

### 6.3 Test duplicity

1. Pridajte druhý riadok s **rovnakým** e-mailom, prázdnym stavom a časom starším ako 10 minút.
2. Spustite produkčnú vetvu.
3. Riadok musí skončiť ako `DUPLICATE_SKIPPED` a e-mail sa nesmie odoslať.

### 6.4 Test chyby

1. Dočasne zadajte nesprávny SMTP port.
2. Spustite testovaciu vetvu.
3. Musí prísť Telegram notifikácia z error workflowu a riadok musí zostať v `PROCESSING`.
4. Port vráťte späť a riadok opravte podľa [runbooku](06-prevadzka-a-incidenty.md#31-riadok-zostal-v-processing).

Kompletný protokol: [`07-qa-checklist.md`](07-qa-checklist.md).

---

## 7. Aktivácia

1. Odstráňte testovacie riadky **celé** (pravý klik na číslo riadku → *Odstrániť riadok*).
2. Skontrolujte, že v produkčnej vetve nie je `Limit` uzol (v šablóne je len v testovacej vetve).
3. Prepnite workflow na **Active**.
4. Sledujte prvé dva behy v **Executions**.
5. Do popisu workflowu (Notes) si zapíšte verziu a dátum nasadenia.

---

## 8. Rollback

### Rýchly (do 5 minút)

1. Workflow **Deactivate**.
2. n8n → **Workflow history** (alebo verzie) → vyberte poslednú funkčnú verziu → **Restore**.
3. Ak história chýba, importujte poslednú zálohu JSON a znovu priraďte credentials.
4. Aktivujte a sledujte dva behy.

### Úplné zastavenie

Deaktivujte workflow. Leady sa hromadia v Sheete s prázdnym stavom — po oprave ich workflow dobehne (10-minútová brzda ich pustí). Ak už boli obslúžené telefonicky, označte ich `SKIP`.

---

## 9. Časté chyby pri importe

| Príznak | Príčina | Riešenie |
|---|---|---|
| `Invalid JSON` | poškodené úvodzovky pri hromadnom nahradení | obnoviť zálohu, nahradiť opatrne |
| Uzly bez prepojení | import staršej verzie n8n | aktualizovať n8n alebo prepojiť ručne podľa schémy |
| `Could not find sheet` | nesedí `[[SHEET_ID]]` alebo hárok | overiť ID a vybrať hárok v uzle |
| `Column not found` | nesedia názvy stĺpcov | opraviť `[[STLPEC_*]]` |
| Telegram `chat not found` | bot nie je v chate alebo zlý `chat_id` | pridať bota, zistiť ID cez `getUpdates` |
| `Invalid credentials` | chýbajúci alebo expirovaný credential | znovu pripojiť v n8n |
| SMTP `Connection timeout` | zlý host/port alebo blokovaný port | overiť u poskytovateľa, skúsiť 587 |

---

## 10. Kontrolný zoznam po nasadení

- [ ] Workflow je **Active** a v Executions pribúdajú behy každých 5 minút.
- [ ] Testovací lead dostal e-mail do 15 minút.
- [ ] `email_status` a `sent_at` sa zapisujú.
- [ ] Telegram notifikácie chodia.
- [ ] Error workflow je priradený a otestovaný.
- [ ] Historické riadky majú `SKIP`.
- [ ] Testovacie riadky sú odstránené.
- [ ] Mám uloženú zálohu JSON a konfiguráciu mimo repozitára.
