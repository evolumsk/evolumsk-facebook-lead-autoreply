/**
 * Uzol: Prepare Lead Data
 * ---------------------------------------------------------------------------
 * Jediný normalizér dát pre e-mail a Telegram. Zjednocuje dve vetvy:
 *   - produkčnú (výstup z "Filter & Deduplicate Leads"),
 *   - testovaciu (surový riadok z "Limit First Row").
 *
 * Výstupom sú polia bezpečné pre HTML aj pre Telegram (parse_mode = HTML).
 * Pred použitím upravte iba blok CONFIG nižšie. Hodnoty musia byť rovnaké
 * ako v uzle "Filter & Deduplicate Leads".
 */

const CONFIG = {
  // Predvolená krajina pre telefónne čísla v lokálnom formáte (09…).
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

// HTML escape pre Telegram (parse_mode = HTML) a pre telo e-mailu
function esc(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function build(row) {
  const emailRaw = String(row[COL.email] || '').trim();
  const cleanName = String(row[COL.fullName] || '').trim();
  const phoneDisplay = String(row[COL.phone] || '').replace(/^p:/i, '').trim();
  const service = String(row[COL.service] || 'neuvedené').trim();
  const budget = String(row[COL.budget] || 'neuvedené').trim();

  return {
    lead_id: String(row[COL.id] || ''),
    row_number: row.row_number === undefined ? null : row.row_number,
    created_time: row[COL.createdTime],
    full_name: cleanName || 'neuvedené',
    greeting_name: cleanName ? ' ' + cleanName : '',
    greeting_html: cleanName ? ' ' + esc(cleanName) : '',
    email: emailRaw,
    phone_display: phoneDisplay || 'neuvedené',
    phone_tel: normalizePhoneForTel(phoneDisplay),
    service: service,
    budget: budget,
    email_status: String(row[COL.status] || ''),
    tg_name: esc(cleanName || 'neuvedené'),
    tg_service: esc(service),
    tg_budget: esc(budget),
    tg_phone_display: esc(phoneDisplay || 'neuvedené'),
    tg_email: esc(emailRaw || 'neuvedené'),
  };
}

return $input.all().map((item) => {
  const row = item.json || {};

  // 1) Produkčná vetva – Filter & Deduplicate Leads už posiela normalizované polia
  if (row.lead_id !== undefined && row._action !== undefined) {
    const out = build({
      [COL.id]: row.lead_id,
      [COL.createdTime]: row.created_time,
      [COL.fullName]: row.greeting_name ? String(row.greeting_name).trim() : row.full_name,
      [COL.email]: row.email,
      [COL.phone]: row.phone_display,
      [COL.service]: row.service,
      [COL.budget]: row.budget,
      [COL.status]: row.email_status,
    });
    return {
      json: {
        ...row,
        ...out,
        age_minutes: row.age_minutes === undefined ? null : row.age_minutes,
        _action: row._action,
        _source: 'production',
      },
    };
  }

  // 2) Testovacia vetva – surový riadok zo Sheetu (obchádza brzdu aj deduplikáciu)
  return {
    json: {
      ...build(row),
      age_minutes: null,
      _action: 'SEND',
      _source: 'force',
    },
  };
});
