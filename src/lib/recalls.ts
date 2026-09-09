// Static, curated recall-pattern stub — illustrative, NOT a live feed from any recall
// authority. Check the real thing at the official government recall aggregator.
export const RECALLS_URL = 'https://www.recalls.gov';

export interface RecallStub {
  category: string;
  brand?: string;
  note: string;
}

export const RECALL_STUBS: RecallStub[] = [
  { category: 'Appliance', brand: 'Whirlpool', note: 'Some Whirlpool dishwashers have been recalled in the past for a heating-element fire risk. Check your exact model/serial at recalls.gov.' },
  { category: 'Appliance', brand: 'Samsung', note: 'Certain Samsung top-load washing machines were recalled for a drum-detachment injury risk. Check your exact model/serial at recalls.gov.' },
  { category: 'Appliance', note: 'Major appliances are recalled fairly often for fire or shock risk. Always check your specific model/serial at recalls.gov rather than assuming it\'s fine.' },
  { category: 'HVAC', note: 'Older gas furnaces have occasionally been recalled for heat-exchanger cracks that can leak carbon monoxide. Check your model at recalls.gov, and keep a working CO detector nearby regardless.' },
  { category: 'Electronics', note: 'Lithium-ion battery devices are periodically recalled for fire risk. Check your specific model at recalls.gov.' },
];

/** Illustrative match only — not a live lookup. Always link the user to the real recalls.gov search. */
export function recallsFor(category: string, brand?: string): RecallStub[] {
  return RECALL_STUBS.filter((r) => r.category === category && (!r.brand || !brand || r.brand.toLowerCase() === brand.toLowerCase()));
}
