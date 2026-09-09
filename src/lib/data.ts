// Image URLs
export const IMAGES = {
  hero: 'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980614645_19bbd53c.png',
  home: [
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980632678_c1a9cc6d.jpg',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980636833_9d8d538d.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980637790_3c7fe0d9.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980639135_6fc45067.png',
  ],
  money: [
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980665236_5c781ba9.jpg',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980667680_a8e53e7a.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980664826_dde94210.jpg',
  ],
  rights: [
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980687236_640ab810.jpg',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980690893_3c9ad390.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980688926_f93f338c.jpg',
  ],
  community: [
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980710783_0626875d.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980710928_8fdf99a8.png',
    'https://d64gsuwffb70l.cloudfront.net/69db4fe9c487e49733c2f062_1775980712386_9c0f3d00.jpg',
  ],
};

export const PILLAR_COLORS = {
  home: { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-600', gradient: 'from-blue-600 to-blue-800' },
  money: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-600', gradient: 'from-emerald-600 to-emerald-800' },
  resolve: { bg: 'bg-amber-600', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-600', gradient: 'from-amber-600 to-amber-800' },
  community: { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-600', gradient: 'from-orange-600 to-orange-800' },
};

export interface DIYGuide {
  id: string;
  title: string;
  category: string;
  difficulty: number;
  estimatedCost: string;
  timeEstimate: string;
  description: string;
  steps: string[];
  tools: string[];
  image: string;
  tags: string[];
}

export const DIY_GUIDES: DIYGuide[] = [
  {
    id: '1', title: 'Fix a Leaky Faucet', category: 'Plumbing', difficulty: 2,
    estimatedCost: '$5-15', timeEstimate: '30-60 min', image: IMAGES.home[0],
    description: 'Stop wasting water and money with this simple faucet repair guide.',
    steps: ['Turn off water supply valves under the sink', 'Remove the faucet handle with a screwdriver', 'Replace the worn washer or O-ring', 'Reassemble and test for leaks'],
    tools: ['Adjustable wrench', 'Screwdriver', 'Replacement washers'],
    tags: ['plumbing', 'water', 'faucet', 'leak']
  },
  {
    id: '2', title: 'Unclog a Drain Naturally', category: 'Plumbing', difficulty: 1,
    estimatedCost: '$2-5', timeEstimate: '15-30 min', image: IMAGES.home[1],
    description: 'Clear slow drains without harsh chemicals using household items.',
    steps: ['Pour boiling water down the drain', 'Add 1/2 cup baking soda, wait 5 minutes', 'Pour 1 cup vinegar, cover and wait 15 minutes', 'Flush with boiling water again'],
    tools: ['Baking soda', 'White vinegar', 'Kettle'],
    tags: ['plumbing', 'drain', 'clog', 'natural']
  },
  {
    id: '3', title: 'Patch Drywall Holes', category: 'Walls & Ceilings', difficulty: 2,
    estimatedCost: '$10-20', timeEstimate: '1-2 hours', image: IMAGES.home[2],
    description: 'Repair nail holes, small dents, and medium holes in your walls.',
    steps: ['Clean the damaged area and remove loose debris', 'Apply mesh patch over the hole', 'Spread joint compound in thin layers, let dry', 'Sand smooth and paint to match'],
    tools: ['Putty knife', 'Sandpaper (120-grit)', 'Joint compound', 'Mesh patch'],
    tags: ['walls', 'drywall', 'repair', 'patch']
  },
  {
    id: '4', title: 'Replace a Light Switch', category: 'Electrical', difficulty: 3,
    estimatedCost: '$3-10', timeEstimate: '20-40 min', image: IMAGES.home[3],
    description: 'Upgrade old switches safely with this step-by-step electrical guide.',
    steps: ['Turn off power at the breaker box', 'Remove the switch plate and unscrew the switch', 'Note wire connections, disconnect old switch', 'Connect wires to new switch, secure and test'],
    tools: ['Voltage tester', 'Screwdriver', 'Wire strippers', 'New switch'],
    tags: ['electrical', 'switch', 'light', 'wiring']
  },
  {
    id: '5', title: 'Seal Windows & Doors', category: 'Weatherproofing', difficulty: 1,
    estimatedCost: '$5-15', timeEstimate: '30-60 min', image: IMAGES.home[0],
    description: 'Reduce energy bills by sealing drafts around windows and doors.',
    steps: ['Inspect for drafts using a candle or incense', 'Clean surfaces where caulk will be applied', 'Apply weatherstripping to doors', 'Caulk gaps around window frames'],
    tools: ['Caulk gun', 'Weatherstripping', 'Caulk', 'Utility knife'],
    tags: ['weatherproofing', 'energy', 'insulation', 'drafts']
  },
  {
    id: '6', title: 'Fix a Running Toilet', category: 'Plumbing', difficulty: 2,
    estimatedCost: '$5-20', timeEstimate: '30-45 min', image: IMAGES.home[1],
    description: 'Stop wasting up to 200 gallons per day from a running toilet.',
    steps: ['Remove tank lid and identify the issue', 'Check the flapper for wear or warping', 'Adjust or replace the fill valve', 'Test and adjust water level'],
    tools: ['Adjustable wrench', 'Replacement flapper', 'Fill valve kit'],
    tags: ['plumbing', 'toilet', 'water', 'repair']
  },
  {
    id: '7', title: 'Install a Programmable Thermostat', category: 'HVAC', difficulty: 3,
    estimatedCost: '$25-50', timeEstimate: '45-90 min', image: IMAGES.home[2],
    description: 'Save up to 10% on heating/cooling by automating your thermostat.',
    steps: ['Turn off HVAC system at breaker', 'Remove old thermostat, label wires', 'Mount new thermostat base plate', 'Connect wires and program schedule'],
    tools: ['Screwdriver', 'Level', 'Drill', 'Wire labels'],
    tags: ['hvac', 'thermostat', 'energy', 'smart home']
  },
  {
    id: '8', title: 'Clean Gutters Safely', category: 'Exterior', difficulty: 2,
    estimatedCost: '$0-10', timeEstimate: '1-2 hours', image: IMAGES.home[3],
    description: 'Prevent water damage and foundation issues with regular gutter cleaning.',
    steps: ['Set up ladder on stable, level ground', 'Scoop debris starting from downspout end', 'Flush gutters with garden hose', 'Check downspouts for clogs'],
    tools: ['Ladder', 'Gutter scoop', 'Garden hose', 'Work gloves'],
    tags: ['exterior', 'gutters', 'water damage', 'maintenance']
  },
  {
    id: '9', title: 'Refinish Hardwood Floors', category: 'Flooring', difficulty: 4,
    estimatedCost: '$50-150', timeEstimate: '2-3 days', image: IMAGES.home[0],
    description: 'Restore worn hardwood floors to their original beauty.',
    steps: ['Clear room and remove baseboards', 'Sand floors with drum sander (3 passes)', 'Vacuum and tack cloth all dust', 'Apply stain and 2-3 coats of polyurethane'],
    tools: ['Drum sander rental', 'Sandpaper (various grits)', 'Stain', 'Polyurethane'],
    tags: ['flooring', 'hardwood', 'refinish', 'restoration']
  },
  {
    id: '10', title: 'Replace Air Filters', category: 'HVAC', difficulty: 1,
    estimatedCost: '$5-20', timeEstimate: '5-10 min', image: IMAGES.home[1],
    description: 'Improve air quality and HVAC efficiency with regular filter changes.',
    steps: ['Locate your HVAC filter slot', 'Note the filter size printed on the frame', 'Remove old filter, note airflow direction', 'Insert new filter with arrow pointing toward duct'],
    tools: ['New filter (correct size)', 'Step stool if needed'],
    tags: ['hvac', 'air quality', 'filter', 'maintenance']
  },
  {
    id: '11', title: 'Fix Squeaky Floors', category: 'Flooring', difficulty: 2,
    estimatedCost: '$5-15', timeEstimate: '30-60 min', image: IMAGES.home[2],
    description: 'Silence annoying floor squeaks with these proven techniques.',
    steps: ['Locate the exact squeak source by walking slowly', 'If accessible from below, shim the gap', 'From above, drive screws through subfloor into joist', 'Fill screw holes and touch up finish'],
    tools: ['Wood shims', 'Screws', 'Drill', 'Wood filler'],
    tags: ['flooring', 'squeak', 'subfloor', 'repair']
  },
  {
    id: '12', title: 'Install a Ceiling Fan', category: 'Electrical', difficulty: 4,
    estimatedCost: '$50-200', timeEstimate: '2-3 hours', image: IMAGES.home[3],
    description: 'Add comfort and reduce energy costs with a new ceiling fan.',
    steps: ['Turn off power and verify with voltage tester', 'Install fan-rated electrical box', 'Assemble fan and mount bracket', 'Connect wiring and attach blades'],
    tools: ['Voltage tester', 'Screwdriver', 'Wire nuts', 'Ladder'],
    tags: ['electrical', 'ceiling fan', 'installation', 'cooling']
  },
  {
    id: '13', title: 'Repair Cracked Grout', category: 'Bathroom', difficulty: 2,
    estimatedCost: '$10-25', timeEstimate: '1-2 hours', image: IMAGES.home[0],
    description: 'Prevent water damage behind tiles by fixing cracked or missing grout.',
    steps: ['Remove old grout with a grout saw', 'Clean joints with a damp sponge', 'Mix new grout to peanut butter consistency', 'Apply with float, wipe excess after 15 minutes'],
    tools: ['Grout saw', 'Grout float', 'Sponge', 'New grout'],
    tags: ['bathroom', 'grout', 'tile', 'water damage']
  },
  {
    id: '14', title: 'Maintain Your Water Heater', category: 'Plumbing', difficulty: 2,
    estimatedCost: '$0-10', timeEstimate: '30-45 min', image: IMAGES.home[1],
    description: 'Extend the life of your water heater and improve efficiency.',
    steps: ['Turn off power/gas to the heater', 'Attach hose to drain valve, flush sediment', 'Test the pressure relief valve', 'Check anode rod condition (replace if needed)'],
    tools: ['Garden hose', 'Bucket', 'Socket wrench'],
    tags: ['plumbing', 'water heater', 'maintenance', 'efficiency']
  },
  {
    id: '15', title: 'Paint a Room Like a Pro', category: 'Walls & Ceilings', difficulty: 2,
    estimatedCost: '$30-80', timeEstimate: '4-8 hours', image: IMAGES.home[2],
    description: 'Get professional-looking results with proper painting technique.',
    steps: ['Clean walls, fill holes, sand smooth', 'Tape edges and cover floors/furniture', 'Cut in edges with angled brush', 'Roll walls in W-pattern, 2 coats minimum'],
    tools: ['Roller and tray', 'Angled brush', 'Painters tape', 'Drop cloths'],
    tags: ['walls', 'paint', 'interior', 'cosmetic']
  },
  {
    id: '16', title: 'Fix a Sticking Door', category: 'Doors & Windows', difficulty: 1,
    estimatedCost: '$0-5', timeEstimate: '15-30 min', image: IMAGES.home[3],
    description: 'Solve common door problems from sticking to not latching properly.',
    steps: ['Identify where the door is rubbing', 'Tighten hinge screws first', 'If still sticking, sand or plane the tight spot', 'Lubricate hinges with WD-40'],
    tools: ['Screwdriver', 'Sandpaper or hand plane', 'Lubricant'],
    tags: ['doors', 'sticking', 'hinges', 'repair']
  },
  {
    id: '17', title: 'Insulate Your Attic', category: 'Weatherproofing', difficulty: 3,
    estimatedCost: '$200-500', timeEstimate: '4-8 hours', image: IMAGES.home[0],
    description: 'The single biggest energy-saving improvement for most homes.',
    steps: ['Seal air leaks around pipes, wires, and ducts', 'Install baffles at eaves for ventilation', 'Lay insulation batts between joists', 'Add second layer perpendicular to first'],
    tools: ['Insulation batts', 'Utility knife', 'Staple gun', 'Safety gear'],
    tags: ['weatherproofing', 'insulation', 'attic', 'energy']
  },
  {
    id: '18', title: 'Replace Cabinet Hardware', category: 'Kitchen', difficulty: 1,
    estimatedCost: '$20-60', timeEstimate: '30-60 min', image: IMAGES.home[1],
    description: 'Instantly update your kitchen or bathroom with new hardware.',
    steps: ['Remove old hardware and clean surfaces', 'Use a template for consistent placement', 'Drill new holes if needed', 'Attach new pulls or knobs'],
    tools: ['Screwdriver', 'Drill', 'Template jig', 'Level'],
    tags: ['kitchen', 'cabinet', 'hardware', 'upgrade']
  },
  {
    id: '19', title: 'Test & Replace Smoke Detectors', category: 'Safety', difficulty: 1,
    estimatedCost: '$10-30', timeEstimate: '15-30 min', image: IMAGES.home[2],
    description: 'Ensure your family\'s safety with properly functioning smoke detectors.',
    steps: ['Press test button on each detector', 'Replace batteries (even if working)', 'Replace units older than 10 years', 'Install detectors in every bedroom and hallway'],
    tools: ['New batteries', 'Replacement detectors', 'Ladder', 'Screwdriver'],
    tags: ['safety', 'smoke detector', 'fire', 'maintenance']
  },
  {
    id: '20', title: 'Build a Simple Shelf', category: 'Storage', difficulty: 2,
    estimatedCost: '$15-40', timeEstimate: '1-2 hours', image: IMAGES.home[3],
    description: 'Add functional storage with a custom-built floating shelf.',
    steps: ['Locate wall studs with a stud finder', 'Install shelf brackets into studs', 'Level and secure the shelf board', 'Sand edges and apply finish'],
    tools: ['Stud finder', 'Level', 'Drill', 'Shelf board and brackets'],
    tags: ['storage', 'shelf', 'organization', 'build']
  },
];

export const GUIDE_CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Walls & Ceilings', 'Weatherproofing', 'HVAC', 'Exterior', 'Flooring', 'Bathroom', 'Kitchen', 'Doors & Windows', 'Safety', 'Storage'];

export interface DisputeTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  avgRecovery: string;
  successRate: string;
  icon: string;
}

export const DISPUTE_TEMPLATES: DisputeTemplate[] = [
  { id: '1', title: 'Medical Bill Overcharge', category: 'Medical', description: 'Challenge incorrect charges, duplicate billing, or inflated prices on medical bills.', avgRecovery: '$500-2,000', successRate: '73%', icon: 'medical' },
  { id: '2', title: 'Credit Report Error', category: 'Credit', description: 'Dispute inaccurate information on your credit report under the FCRA.', avgRecovery: '50-100 pts', successRate: '79%', icon: 'credit' },
  { id: '3', title: 'Utility Bill Dispute', category: 'Utilities', description: 'Challenge unusually high utility bills or incorrect meter readings.', avgRecovery: '$100-500', successRate: '65%', icon: 'utility' },
  { id: '4', title: 'Insurance Claim Denial', category: 'Insurance', description: 'Appeal denied insurance claims with proper documentation and legal backing.', avgRecovery: '$1,000-10,000', successRate: '58%', icon: 'insurance' },
  { id: '5', title: 'Bank Fee Reversal', category: 'Banking', description: 'Request reversal of overdraft fees, maintenance fees, and hidden charges.', avgRecovery: '$35-200', successRate: '85%', icon: 'bank' },
  { id: '6', title: 'Subscription Cancellation Refund', category: 'Consumer', description: 'Recover charges from subscriptions that were difficult to cancel.', avgRecovery: '$50-300', successRate: '71%', icon: 'subscription' },
  { id: '7', title: 'Debt Validation Request', category: 'Debt', description: 'Require debt collectors to prove the debt is valid under the FDCPA.', avgRecovery: '$500-5,000', successRate: '42%', icon: 'debt' },
  { id: '8', title: 'Property Tax Assessment Appeal', category: 'Tax', description: 'Challenge an inflated property tax assessment with comparable data.', avgRecovery: '$200-2,000/yr', successRate: '40%', icon: 'tax' },
];

export interface LegalTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  filingFee: string;
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  { id: '1', title: 'Small Claims Court Filing', category: 'Court Filing', description: 'File a small claims case for disputes under $10,000 without an attorney.', difficulty: 'Moderate', filingFee: '$30-75' },
  { id: '2', title: 'Demand Letter', category: 'Pre-Litigation', description: 'Formal demand letter that often resolves disputes before court.', difficulty: 'Easy', filingFee: '$0' },
  { id: '3', title: 'FOIA Request', category: 'Government', description: 'Request public records from government agencies under the Freedom of Information Act.', difficulty: 'Easy', filingFee: '$0' },
  { id: '4', title: 'Cease and Desist Letter', category: 'Pre-Litigation', description: 'Formally demand someone stop harmful or illegal activity.', difficulty: 'Easy', filingFee: '$0' },
  { id: '5', title: 'Tenant Rights Complaint', category: 'Housing', description: 'File a complaint against a landlord for habitability issues or illegal practices.', difficulty: 'Moderate', filingFee: '$0-50' },
  { id: '6', title: 'Consumer Protection Complaint', category: 'Consumer', description: 'File complaints with the FTC, CFPB, or state attorney general.', difficulty: 'Easy', filingFee: '$0' },
  { id: '7', title: 'Wage Theft Claim', category: 'Employment', description: 'Recover unpaid wages, overtime, or tips from an employer.', difficulty: 'Moderate', filingFee: '$0' },
  { id: '8', title: 'Attorney Complaint', category: 'Accountability', description: 'File a formal complaint against an attorney with the state bar.', difficulty: 'Moderate', filingFee: '$0' },
  { id: '9', title: 'Judicial Conduct Complaint', category: 'Accountability', description: 'Report judicial misconduct to the state judicial conduct commission.', difficulty: 'Moderate', filingFee: '$0' },
  { id: '10', title: 'ADA Accommodation Request', category: 'Civil Rights', description: 'Request reasonable accommodations under the Americans with Disabilities Act.', difficulty: 'Easy', filingFee: '$0' },
  { id: '11', title: 'Police Misconduct Complaint', category: 'Accountability', description: 'File a formal complaint about police misconduct with internal affairs.', difficulty: 'Moderate', filingFee: '$0' },
  { id: '12', title: 'Expungement Petition', category: 'Court Filing', description: 'Petition to seal or expunge eligible criminal records.', difficulty: 'Hard', filingFee: '$50-200' },
  { id: '13', title: 'Restraining Order', category: 'Court Filing', description: 'File for a protective order against harassment or threats.', difficulty: 'Moderate', filingFee: '$0-50' },
  { id: '14', title: 'Power of Attorney', category: 'Estate', description: 'Create a legal document granting someone authority to act on your behalf.', difficulty: 'Easy', filingFee: '$0-25' },
  { id: '15', title: 'Living Will / Advance Directive', category: 'Estate', description: 'Document your healthcare wishes in case you cannot communicate them.', difficulty: 'Easy', filingFee: '$0' },
];

export const LEGAL_CATEGORIES = ['All', 'Court Filing', 'Pre-Litigation', 'Government', 'Housing', 'Consumer', 'Employment', 'Accountability', 'Civil Rights', 'Estate'];

export interface Stat {
  label: string;
  value: string;
  description: string;
}

export const PLATFORM_STATS: Stat[] = [
  { label: 'Money Recovered', value: '$2.4M+', description: 'Recovered by our community members' },
  { label: 'Homes Maintained', value: '15,000+', description: 'DIY repairs completed successfully' },
  { label: 'Rights Protected', value: '8,500+', description: 'Legal actions taken with our guides' },
  { label: 'Neighbors Connected', value: '42,000+', description: 'Community members helping each other' },
];
