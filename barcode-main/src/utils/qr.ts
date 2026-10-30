import QRCode from 'qrcode';

/**
 * Generates an ultra-crisp, high-density vector SVG for QR codes
 * using solid filled rectangles (<rect fill="...">).
 *
 * This completely avoids stroked line rendering, fractional pixel snapping,
 * and grey anti-aliasing artifacts during printing and previewing.
 */
export function generateSolidQrSvg(
  value: string,
  fgColor: string = '#000000',
  bgColor: string = '#ffffff',
  margin: number = 1
): string {
  try {
    const qr = QRCode.create(value || ' ', { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const totalSize = size + margin * 2;
    let rects = '';

    for (let r = 0; r < size; r++) {
      let runStart = -1;
      let runLen = 0;
      for (let c = 0; c < size; c++) {
        const isDark = qr.modules.get(r, c);
        if (isDark) {
          if (runStart === -1) {
            runStart = c;
            runLen = 1;
          } else {
            runLen++;
          }
        } else {
          if (runStart !== -1) {
            rects += `<rect x="${runStart + margin}" y="${r + margin}" width="${(runLen + 0.04).toFixed(2)}" height="1.04" fill="${fgColor}" />`;
            runStart = -1;
            runLen = 0;
          }
        }
      }
      if (runStart !== -1) {
        rects += `<rect x="${runStart + margin}" y="${r + margin}" width="${(runLen + 0.04).toFixed(2)}" height="1.04" fill="${fgColor}" />`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="100%" height="100%" shape-rendering="crispEdges" style="display:block;background:${bgColor};"><rect width="${totalSize}" height="${totalSize}" fill="${bgColor}"/>${rects}</svg>`;
  } catch {
    return '';
  }
}

