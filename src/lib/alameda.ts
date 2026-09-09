/**
 * Alameda County ZIP allow-list — trial gate for the unclaimed-property check.
 *
 * NOTE: This is a starter list covering Alameda County's incorporated cities
 * and main unincorporated areas (Castro Valley, San Lorenzo, Sunol). ZIP↔county
 * mapping is not perfectly clean — a few ZIPs straddle county lines. Before the
 * trial goes wide, VERIFY/EXPAND this against an authoritative source
 * (USPS ZIP data or the Alameda County GIS), so no real resident is wrongly
 * blocked and no out-of-county address slips through.
 */
export const ALAMEDA_ZIPS = new Set<string>([
  // Alameda
  '94501', '94502',
  // Albany
  '94706',
  // Berkeley
  '94701', '94702', '94703', '94704', '94705', '94707', '94708', '94709', '94710', '94720',
  // Castro Valley
  '94546', '94552',
  // Dublin
  '94568',
  // Emeryville
  '94608', '94662',
  // Fremont
  '94536', '94537', '94538', '94539', '94555',
  // Hayward
  '94540', '94541', '94542', '94543', '94544', '94545', '94557',
  // Livermore
  '94550', '94551',
  // Newark
  '94560',
  // Oakland
  '94601', '94602', '94603', '94605', '94606', '94607', '94609',
  '94610', '94611', '94612', '94613', '94618', '94619', '94621',
  // Piedmont (shares Oakland ZIPs 94610/94611)
  // Pleasanton
  '94566', '94588',
  // San Leandro
  '94577', '94578', '94579',
  // San Lorenzo
  '94580',
  // Sunol
  '94586',
  // Union City
  '94587',
]);

/** Pull a 5-digit ZIP out of free-text and test it against the Alameda list. */
export const isAlamedaZip = (zip: string): boolean => {
  const m = (zip || '').match(/\b(\d{5})\b/);
  return m ? ALAMEDA_ZIPS.has(m[1]) : false;
};

/** Convenience: validate the ZIP portion of a full address string. */
export const addressInAlameda = (address: string): boolean => isAlamedaZip(address);
