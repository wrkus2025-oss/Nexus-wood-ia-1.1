import { CutSettings, SheetLayout } from './cut-optimization';

const SVG_PADDING = 60;
const SVG_SHEET_GAP = 140;

function escapeXml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function downloadTextFile(contents: string, filename: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildSvgCutPlan(layouts: SheetLayout[], settings: CutSettings) {
  const scale = Math.min(0.24, 1000 / Math.max(settings.sheetWidthMm, settings.sheetHeightMm));
  const sheetWidth = settings.sheetWidthMm * scale;
  const sheetHeight = settings.sheetHeightMm * scale;
  const width = sheetWidth + SVG_PADDING * 2;
  const height = layouts.length * (sheetHeight + SVG_SHEET_GAP) + SVG_PADDING;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<style>text{font-family:Arial,sans-serif} .sheet{fill:#18181b;stroke:#52525b;stroke-width:2} .piece{stroke:#09090b;stroke-width:1.25} .title{fill:#e4e4e7;font-size:18px;font-weight:bold} .meta{fill:#a1a1aa;font-size:12px} .label{fill:#fafafa;font-size:11px;font-weight:bold} .dim{fill:#d4d4d8;font-size:10px}</style>',
    `<text class="title" x="${SVG_PADDING}" y="30">Nexus Wood AI — Plano de Corte</text>`,
  ];

  layouts.forEach((sheet, sheetIndex) => {
    const top = SVG_PADDING + sheetIndex * (sheetHeight + SVG_SHEET_GAP);
    parts.push(
      `<text class="meta" x="${SVG_PADDING}" y="${top - 18}">Chapa ${sheetIndex + 1} • ${settings.sheetWidthMm} × ${settings.sheetHeightMm} mm • Aproveitamento ${sheet.utilizationPercent.toFixed(1)}%</text>`,
      `<rect class="sheet" x="${SVG_PADDING}" y="${top}" width="${sheetWidth}" height="${sheetHeight}" rx="12" ry="12" />`,
    );

    sheet.placements.forEach((placement, index) => {
      const hue = (index * 47) % 360;
      const left = SVG_PADDING + placement.xMm * scale;
      const y = top + placement.yMm * scale;
      const pieceWidth = placement.widthMm * scale;
      const pieceHeight = placement.heightMm * scale;
      const labelX = left + pieceWidth / 2;
      const labelY = y + pieceHeight / 2 - 6;

      parts.push(
        `<rect class="piece" x="${left}" y="${y}" width="${pieceWidth}" height="${pieceHeight}" fill="hsla(${hue}, 75%, 55%, 0.48)" rx="6" ry="6" />`,
        `<text class="label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeXml(placement.label)}</text>`,
        `<text class="dim" x="${labelX}" y="${labelY + 14}" text-anchor="middle">${placement.widthMm} × ${placement.heightMm} mm</text>`,
      );
    });
  });

  parts.push('</svg>');
  return parts.join('');
}

function dxfLine(x1: number, y1: number, x2: number, y2: number) {
  return `0
LINE
8
CUTPLAN
10
${x1}
20
${y1}
11
${x2}
21
${y2}
`;
}

function dxfText(text: string, x: number, y: number, height = 24) {
  return `0
TEXT
8
ANNOTATION
10
${x}
20
${y}
40
${height}
1
${text}
`;
}

export function buildDxfCutPlan(layouts: SheetLayout[], settings: CutSettings) {
  const entities: string[] = [];

  layouts.forEach((sheet, sheetIndex) => {
    const yOffset = -sheetIndex * (settings.sheetHeightMm + 300);
    const maxY = yOffset - settings.sheetHeightMm;

    entities.push(
      dxfLine(0, yOffset, settings.sheetWidthMm, yOffset),
      dxfLine(settings.sheetWidthMm, yOffset, settings.sheetWidthMm, maxY),
      dxfLine(settings.sheetWidthMm, maxY, 0, maxY),
      dxfLine(0, maxY, 0, yOffset),
      dxfText(`Nexus Wood AI - Chapa ${sheetIndex + 1}`, 0, yOffset + 60, 28),
    );

    sheet.placements.forEach((placement) => {
      const left = placement.xMm;
      const top = yOffset - placement.yMm;
      const right = left + placement.widthMm;
      const bottom = top - placement.heightMm;
      const centerX = left + placement.widthMm / 2;
      const centerY = top - placement.heightMm / 2;

      entities.push(
        dxfLine(left, top, right, top),
        dxfLine(right, top, right, bottom),
        dxfLine(right, bottom, left, bottom),
        dxfLine(left, bottom, left, top),
        dxfText(placement.label, centerX - placement.widthMm * 0.2, centerY + 18, 22),
        dxfText(`${placement.widthMm}x${placement.heightMm}mm`, centerX - placement.widthMm * 0.24, centerY - 12, 18),
      );
    });
  });

  return `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
${entities.join('')}0
ENDSEC
0
EOF
`;
}
