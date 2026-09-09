/** User-Agent based mobile check — deliberately not viewport-based, so resizing a desktop
 * browser window never flips the app between marketing-landing and guest-hub modes. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
}
