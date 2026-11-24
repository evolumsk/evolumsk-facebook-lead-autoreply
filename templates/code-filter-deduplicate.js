/**
 * Uzol: Filter & Deduplicate Leads
 * ---------------------------------------------------------------------------
 * Vyberie riadky z Google Sheetu, ktoré sú:
 *   1. nové            -> email_status je prázdny,
 *   2. dostatočne staré -> od created_time uplynulo aspoň minAgeMinutes,
 *   3. nie duplicitné   -> rovnaký e-mail ešte nedostal správu.
 *
 * Vstup:  všetky riadky z uzla "Get All Leads".
 * Výstup: jeden objekt na riadok s _action = "SEND" | "DUPLICATE_SKIPPED".
 *
 * Pred použitím upravte iba blok CONFIG nižšie. Hodnoty musia byť rovnaké
 * ako v uzle "Prepare Lead Data".
 */

const CONFIG = {
  // Ako dlho má lead "dozrieť" pred odoslaním e-mailu (v minútach).
  // Odporúčané 10–15. Pri 5-minútovom cykle je doručenie v okne 10–15 min.
  minAgeMinutes: 10,

  // Predvolená krajina pre telefónne čísla v lokálnom formáte (09…).
  // Slovensko = '421', Česko = '420'.
  countryCode: '421',

  // Presné názvy stĺpcov z hlavičky Google Sheetu (pozor na diakritiku).
  columns: {
    id: '[[STLPEC_ID]]',
    createdTime: '[[STLPEC_CAS]]',
    fullName: '[[STLPEC_MENO]]',
    email: '[[STLPEC_EMAIL]]',
    phone: '[[STLPEC_TELEFON]]',
    service: '[[STLPEC_SLUZBA]]',
    budget: '[[STLPEC_ROZPOCET]]',
    status: '[[STLPEC_STAV]]',
  },
};

const COL = CONFIG.columns;
const MIN_AGE_MINUTES = CONFIG.minAgeMinutes;
const items = $input.all();
const nowMs = Date.now();

// 1) E-maily, ktoré už boli odoslané alebo sa práve spracúvajú
const processedEmails = new Set();
for (const item of items) {
  const status = String(item.json[COL.status] || '').trim().toUpperCase();
  const email = String(item.json[COL.email] || '').trim().toLowerCase();
  if (email && (status === 'SENT' || status === 'PROCESSING')) {
    processedEmails.add(email);
  }
}

// 2) Robustné parsovanie času vytvorenia leadu
//    Podporuje ISO, slovenský formát DD.MM.YYYY HH:mm a Google Sheets serial.
function parseCreatedTime(raw) {
  if (raw === null || raw === undefined || raw === '') return NaN;
  if (typeof raw === 'number') {
    return raw > 1e12 ? raw : (raw > 1e9 ? raw * 1000 : (raw - 25569) * 86400 * 1000);
  }
  const str = String(raw).trim();
  const iso = Date.parse(str);
  if (!Number.isNaN(iso)) return iso;
  const m = str.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})[,\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, d, mo, y, hh, mi, ss = '0'] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi), Number(ss)).getTime();
  }
  return NaN;
}

// 3) Telefón -> E.164 pre klikateľný tel: odkaz
function normalizePhoneForTel(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = CONFIG.countryCode + digits.slice(1);
  }
  return digits ? '+' + digits : '';
}

const results = [];

for (const item of items) {
  const row = item.json;
  const status = String(row[COL.status] || '').trim();
  const emailRaw = String(row[COL.email] || '').trim();
  const emailLower = emailRaw.toLowerCase();

  // Spracovať len riadky bez stavu a s platným e-mailom
  if (status !== '' || !emailLower.includes('@')) continue;

  // 10-minútová brzda: e-mail odchádza najskôr po uplynutí minAgeMinutes
  const createdMs = parseCreatedTime(row[COL.createdTime]);
  if (Number.isNaN(createdMs)) continue;
  const ageMinutes = (nowMs - createdMs) / 60000;
  if (ageMinutes < MIN_AGE_MINUTES) continue;

  const cleanName = String(row[COL.fullName] || '').trim();
  const cleanPhoneDisplay = String(row[COL.phone] || '').replace(/^p:/i, '').trim();

  // Deduplikácia podľa e-mailu v rámci celého Sheetu aj aktuálneho behu
  const isDuplicate = processedEmails.has(emailLower);
  if (!isDuplicate) processedEmails.add(emailLower);

  results.push({
    json: {
      lead_id: String(row[COL.id] || ''),
      created_time: row[COL.createdTime],
      age_minutes: Math.round(ageMinutes),
      full_name: cleanName || 'neuvedené',
      greeting_name: cleanName ? ' ' + cleanName : '',
      email: emailRaw,
      phone_display: cleanPhoneDisplay || 'neuvedené',
      phone_tel: normalizePhoneForTel(cleanPhoneDisplay),
      service: String(row[COL.service] || 'neuvedené').trim(),
      budget: String(row[COL.budget] || 'neuvedené').trim(),
      _action: isDuplicate ? 'DUPLICATE_SKIPPED' : 'SEND',
    },
  });
}

return results;
