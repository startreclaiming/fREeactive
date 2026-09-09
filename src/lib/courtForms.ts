// Illustrative mapping of Resolve topics to the kind of CA form/venue that's typically
// relevant — NOT legal advice, and deliberately not a fabricated deep link to a specific
// PDF (form URLs move; the stable, safe link is the official forms search page).
export interface CourtFormRef {
  code: string;
  name: string;
}

export const COURT_FORMS_URL = 'https://courts.ca.gov/forms';

export const COURT_FORM_BY_TOPIC: Record<string, CourtFormRef> = {
  'Tenancy & Housing': { code: 'UD-105', name: 'Answer—Unlawful Detainer / habitability declaration' },
  'Family / Domestic Violence': { code: 'DV-100 / FL-300', name: 'Request for Domestic Violence Restraining Order / Request for Order' },
  'Consumer Rights': { code: 'SC-100', name: "Plaintiff's Claim (Small Claims)" },
  'Utilities & Billing': { code: 'SC-100', name: "Plaintiff's Claim (Small Claims)" },
  'Employment': { code: 'DLSE wage claim', name: "Labor Commissioner's Office wage claim, or general civil complaint" },
  'Benefits & Entitlements': { code: 'Administrative appeal', name: 'Agency appeal process (not a Judicial Council form)' },
};

export function courtFormFor(topic: string): CourtFormRef {
  return COURT_FORM_BY_TOPIC[topic] || { code: 'Self-Help Center', name: 'General self-represented litigant guidance' };
}
