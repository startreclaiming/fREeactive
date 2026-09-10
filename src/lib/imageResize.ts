/** Downscale + re-encode an image file so uploads stay small and reliable for the API. */
export function readResized(file: File, maxDim = 1600): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ data: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}
