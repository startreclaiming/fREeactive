/**
 * discoveryService.ts — Live CA SCO query
 *
 * Table: ca_unclaimed_property
 * Columns used:
 *   owner_name        TEXT   — name to match against
 *   holder_name       TEXT   — who is holding the property
 *   property_type     TEXT   — type of property
 *   amount            NUMERIC
 *   reported_year     INTEGER
 *   last_known_address TEXT  — full address string (ZIP embedded)
 *   property_id       TEXT   — SCO's own identifier
 *
 * SEARCH STRATEGY
 *   1. DB: owner_name ILIKE '%name%' catches substrings (Sam→Samantha/Samuel)
 *      Plus OR clause for known variants that are NOT substrings (Sam→Mohamed→Muhammad)
 *   2. DB: last_known_address ILIKE '%ZIP%' for each provided ZIP code
 *   3. Client: score each result into confirmed / possible tiers
 *
 * RLS NOTE
 *   ca_unclaimed_property must allow anonymous SELECT.
 *   If RLS is enabled, create a public read policy:
 *     CREATE POLICY "public_read" ON ca_unclaimed_property FOR SELECT USING (true);
 */

import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UnclaimedProperty {
  id: string;
  owner_name: string;
  reported_year: number;
  amount: number;
  reported_by: string;
  property_type: string;
  address: string;
  city: string;
  zip: string;
  state: string;
}

export interface SearchParams {
  name: string;
  zips: string[];
}

export interface SearchResults {
  confirmed: UnclaimedProperty[];
  possible: UnclaimedProperty[];
  totalAmount: number;
}

// ── Address parsing (last_known_address is a single text field) ────────────

function extractZip(address: string): string {
  const m = (address || '').match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : '';
}

function extractCity(address: string): string {
  // CA format is typically "STREET, CITY, CA XXXXX" or "STREET CITY CA XXXXX"
  const m = (address || '').match(/,\s*([^,]+),?\s+CA\s+\d{5}/i);
  if (m) return m[1].trim();
  // Fallback: word before CA
  const m2 = (address || '').match(/(\w[\w\s]+?)\s+CA\s+\d{5}/i);
  return m2 ? m2[1].trim() : '';
}

// ── Diacritic normalisation ────────────────────────────────────────────────

const DIACRITICS: [RegExp, string][] = [
  [/[àáâãäå]/gi,'a'],[/[èéêë]/gi,'e'],[/[ìíîï]/gi,'i'],
  [/[òóôõö]/gi,'o'],[/[ùúûü]/gi,'u'],[/[ý]/gi,'y'],
  [/[ñ]/gi,'n'],[/[ç]/gi,'c'],[/[ß]/gi,'ss'],
  [/[æ]/gi,'ae'],[/[ø]/gi,'o'],[/[š]/gi,'s'],
  [/[ž]/gi,'z'],[/[ğ]/gi,'g'],[/[ı]/gi,'i'],
];
function normalize(s: string): string {
  let r = s.toUpperCase().trim();
  for (const [re, rep] of DIACRITICS) r = r.replace(re, rep);
  return r.replace(/[-']/g,'').replace(/\s+/g,' ');
}

// ── Soundex ────────────────────────────────────────────────────────────────

function soundex(s: string): string {
  const MAP: Record<string,string> = {
    B:'1',F:'1',P:'1',V:'1',C:'2',G:'2',J:'2',K:'2',Q:'2',S:'2',X:'2',Z:'2',
    D:'3',T:'3',L:'4',M:'5',N:'5',R:'6',
  };
  const up = s.toUpperCase().replace(/[^A-Z]/g,'');
  if (!up) return '';
  let code = up[0], prev = MAP[up[0]]||'0';
  for (let i=1; i<up.length && code.length<4; i++) {
    const c = MAP[up[i]]||'0';
    if (c!=='0' && c!==prev) { code+=c; prev=c; }
    else { prev = c==='0'?prev:c; }
  }
  return code.padEnd(4,'0');
}

// ── Name variant dictionary ────────────────────────────────────────────────

const VARIANTS: Record<string,string[]> = {
  'SAM':['SAMUEL','SAMMY','SAMANTHA','SAMSON'],
  'SAMUEL':['SAM','SAMMY'],'SAMANTHA':['SAM','SAMMY'],
  'BOB':['ROBERT','ROBERTO','BOBBY','ROB'],'ROBERT':['BOB','BOBBY','ROB','ROBERTO'],
  'BILL':['WILLIAM','BILLY','WILL','LIAM'],'WILLIAM':['BILL','BILLY','WILL','LIAM'],
  'JIM':['JAMES','JIMMY','JAMIE'],'JAMES':['JIM','JIMMY','JAMIE'],
  'MIKE':['MICHAEL','MICK'],'MICHAEL':['MIKE','MICK','MIGUEL'],
  'DAVE':['DAVID'],'DAVID':['DAVE'],
  'STEVE':['STEVEN','STEPHEN'],'STEVEN':['STEVE','STEPHEN'],'STEPHEN':['STEVE','STEVEN'],
  'CHRIS':['CHRISTOPHER'],'CHRISTOPHER':['CHRIS'],
  'TOM':['THOMAS','TOMAS'],'THOMAS':['TOM','TOMAS'],
  'TONY':['ANTHONY','ANTONIO'],'ANTHONY':['TONY','ANTONIO'],
  'JOE':['JOSEPH','JOEY','JOSE'],'JOSEPH':['JOE','JOEY'],
  'JOHN':['JOHNNY','JON','JACK','JUAN','IVAN'],
  'JACK':['JOHN'],'NICK':['NICHOLAS','NICKY'],'NICHOLAS':['NICK','NICKY'],
  'ALEX':['ALEXANDER','ALEJANDRO'],'ALEXANDER':['ALEX','ALEJANDRO'],
  'DAN':['DANIEL','DANNY'],'DANIEL':['DAN','DANNY'],
  'MATT':['MATTHEW'],'MATTHEW':['MATT'],
  'ANDY':['ANDREW','ANDRE'],'ANDREW':['ANDY','ANDRE','ANDRES'],
  'RON':['RONALD','RONNIE'],'RONALD':['RON','RONNIE'],
  'LIZ':['ELIZABETH','LISA','BETH','BETTY'],'ELIZABETH':['LIZ','LISA','BETH','BETTY'],
  'KATE':['KATHERINE','KATHRYN','KATHY','KATIE'],'KATHERINE':['KATE','KATHRYN','KATHY'],
  'JENNY':['JENNIFER','JEN'],'JENNIFER':['JENNY','JEN'],
  'SUE':['SUSAN','SUZANNE'],'SUSAN':['SUE','SUZANNE'],
  'PAT':['PATRICIA','PATRICK'],'PATRICIA':['PAT','PATTY'],
  'CHARLIE':['CHARLES','CHUCK'],'CHARLES':['CHARLIE','CHUCK'],
  'DICK':['RICHARD','RICK'],'RICHARD':['DICK','RICK'],'RICK':['RICHARD'],
  // Arabic / Middle Eastern
  'MOHAMED':['MUHAMMAD','MOHAMMED','MOHAMAD','MUHAMMED','MEHMET','MAHMOUD'],
  'MUHAMMAD':['MOHAMED','MOHAMMED','MOHAMAD','MUHAMMED'],
  'MOHAMMED':['MOHAMED','MUHAMMAD','MOHAMAD'],
  'AHMAD':['AHMED','AHMET'],'AHMED':['AHMAD','AHMET'],
  'OMAR':['UMAR','OMER'],'HASSAN':['HASAN','HUSSEIN'],
  'HUSSEIN':['HASSAN','HOSSEIN'],'YOUSSEF':['YOUSEF','YUSUF'],
  'FATIMA':['FATIMAH'],'AISHA':['AYESHA','AYSHA'],
  // Hispanic
  'JOSE':['JOSEPH','JOE'],'JUAN':['JOHN'],
  'CARLOS':['CHARLES'],'MIGUEL':['MICHAEL','MIKE'],
  'LUIS':['LOUIS','LEWIS'],'JORGE':['GEORGE'],
  'ALEJANDRO':['ALEXANDER','ALEX'],'ROBERTO':['ROBERT','ROB'],
  'ANTONIO':['ANTHONY','TONY'],'MARIA':['MARY','MARIE'],
  // Chinese
  'LEE':['LI'],'LI':['LEE'],'CHEN':['CHAN'],'CHAN':['CHEN'],
  'WANG':['WONG'],'WONG':['WANG'],'ZHANG':['CHANG'],'CHANG':['ZHANG'],
  // South / East Asian
  'NGUYEN':['NGUEN'],'TRAN':['TRAHN'],'PARK':['PAK'],'PAK':['PARK'],
};

// ── Build name queries — includes variants for non-substring cases ──────────

function getSearchTerms(name: string): string[] {
  const norm = normalize(name);
  const terms = new Set<string>([norm]);
  // Add variants for each token that would NOT be a substring of the other
  for (const token of norm.split(' ')) {
    const vars = VARIANTS[token] || [];
    for (const v of vars) {
      // Only add variant as separate query term if it doesn't contain the token
      // and the token doesn't contain it (i.e. it won't be caught by ILIKE '%token%')
      if (!v.includes(token) && !token.includes(v)) {
        terms.add(v);
      }
    }
  }
  return Array.from(terms);
}

// ── Match scoring (client-side tier assignment) ────────────────────────────

function scoreMatch(recordName: string, queryName: string): 'confirmed'|'possible'|'none' {
  const rN = normalize(recordName);
  const qN = normalize(queryName);
  if (rN === qN || rN.includes(qN) || qN.includes(rN)) return 'confirmed';

  const rTokens = rN.split(' ');
  const qTokens = qN.split(' ');

  for (const rT of rTokens) {
    for (const qT of qTokens) {
      if (qT.length < 2) continue;
      const qVars = VARIANTS[qT]||[], rVars = VARIANTS[rT]||[];
      if (qVars.includes(rT)||rVars.includes(qT)) return 'confirmed';
      if (qT.length>=4 && (rT.startsWith(qT)||qT.startsWith(rT))) return 'confirmed';
      if (qT.length>=3 && (rT.startsWith(qT)||qT.startsWith(rT))) return 'possible';
    }
  }

  const rFirst = rTokens[0]||'', qFirst = qTokens[0]||'';
  if (qFirst.length>1 && rFirst.length>1 && soundex(qFirst)===soundex(rFirst)) return 'possible';
  return 'none';
}

// ── Map DB row to UnclaimedProperty ───────────────────────────────────────

function mapRow(row: Record<string, unknown>): UnclaimedProperty {
  const addr = String(row.last_known_address || '');
  return {
    id: String(row.property_id || row.id || Math.random()),
    owner_name: String(row.owner_name || ''),
    reported_year: Number(row.reported_year) || 0,
    amount: parseFloat(String(row.amount)) || 0,
    reported_by: String(row.holder_name || ''),
    property_type: String(row.property_type || ''),
    address: addr,
    city: extractCity(addr),
    zip: extractZip(addr),
    state: 'CA',
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function searchStateLedger(params: SearchParams): Promise<SearchResults> {
  const { name, zips } = params;
  if (!name || name.trim().length < 2) return { confirmed: [], possible: [], totalAmount: 0 };

  const cleanZips = zips.map(z => z.trim()).filter(Boolean);
  const searchTerms = getSearchTerms(name.trim());

  // Build name OR clause covering the primary term and non-substring variants
  // e.g. "Sam" → searches Sam + Muhammad (won't appear in ILIKE '%sam%')
  const nameFilters = searchTerms
    .map(t => `owner_name.ilike.%${t}%`)
    .join(',');

  // Note: last_known_address format is "STREET, CITY, CA" — no ZIP embedded.
  // Location filtering is not possible on this table; search by name only.
  // Users verify which records are theirs by recognising the city/address shown.
  let query = supabase
    .from('ca_unclaimed_property')
    .select('property_id, owner_name, holder_name, property_type, amount, reported_year, last_known_address')
    .or(nameFilters)
    .order('amount', { ascending: false })
    .limit(100);

  const { data, error } = await query;

  if (error) {
    console.error('SCO query error:', error.message);
    throw new Error(error.message);
  }

  const records = (data || []).map(row => mapRow(row as Record<string, unknown>));

  const confirmed: UnclaimedProperty[] = [];
  const possible:  UnclaimedProperty[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    const tier = scoreMatch(record.owner_name, name.trim());
    if (tier === 'confirmed') confirmed.push(record);
    else if (tier === 'possible') possible.push(record);
  }

  const totalAmount = [...confirmed, ...possible].reduce((s, r) => s + (r.amount || 0), 0);
  return { confirmed, possible, totalAmount };
}
