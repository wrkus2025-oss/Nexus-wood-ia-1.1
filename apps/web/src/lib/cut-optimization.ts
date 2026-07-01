export type CutPiece = {
  label: string;
  widthMm: number;
  heightMm: number;
  qty: number;
};

export type CutSettings = {
  sheetWidthMm: number;
  sheetHeightMm: number;
  sawKerfMm: number;
  edgeBandingMm: number;
  wasteTargetPercent: number;
};

type FreeRect = {
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
};

export type Placement = {
  id: string;
  label: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  cutWidthMm: number;
  cutHeightMm: number;
  rotated: boolean;
};

export type SheetLayout = {
  index: number;
  placements: Placement[];
  usedAreaMm2: number;
  wastePercent: number;
  utilizationPercent: number;
};

export type OptimizationResult = {
  layouts: SheetLayout[];
  totalAreaMm2: number;
  totalCutAreaMm2: number;
  totalSheets: number;
  wastePercent: number;
  utilizationPercent: number;
  unplaced: string[];
};

type ExpandedPiece = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

type SheetState = {
  placements: Placement[];
  freeRects: FreeRect[];
};

function sanitizeSize(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function splitRect(
  rect: FreeRect,
  pieceWidthMm: number,
  pieceHeightMm: number,
  sawKerfMm: number,
): FreeRect[] {
  const remainingWidth = rect.widthMm - pieceWidthMm;
  const remainingHeight = rect.heightMm - pieceHeightMm;

  const rects: FreeRect[] = [];

  if (remainingWidth > remainingHeight) {
    const rightWidth = remainingWidth - sawKerfMm;
    if (rightWidth > 0) {
      rects.push({
        x: rect.x + pieceWidthMm + sawKerfMm,
        y: rect.y,
        widthMm: rightWidth,
        heightMm: rect.heightMm,
      });
    }

    const bottomHeight = remainingHeight - sawKerfMm;
    if (bottomHeight > 0) {
      rects.push({
        x: rect.x,
        y: rect.y + pieceHeightMm + sawKerfMm,
        widthMm: pieceWidthMm,
        heightMm: bottomHeight,
      });
    }
  } else {
    const bottomHeight = remainingHeight - sawKerfMm;
    if (bottomHeight > 0) {
      rects.push({
        x: rect.x,
        y: rect.y + pieceHeightMm + sawKerfMm,
        widthMm: rect.widthMm,
        heightMm: bottomHeight,
      });
    }

    const rightWidth = remainingWidth - sawKerfMm;
    if (rightWidth > 0) {
      rects.push({
        x: rect.x + pieceWidthMm + sawKerfMm,
        y: rect.y,
        widthMm: rightWidth,
        heightMm: pieceHeightMm,
      });
    }
  }

  return rects.filter((item) => item.widthMm > 0 && item.heightMm > 0);
}

function createSheet(sheetWidthMm: number, sheetHeightMm: number): SheetState {
  return {
    placements: [],
    freeRects: [{ x: 0, y: 0, widthMm: sheetWidthMm, heightMm: sheetHeightMm }],
  };
}

export function optimizeCutPlan(
  pieces: CutPiece[],
  inputSettings: CutSettings,
): OptimizationResult {
  const settings: CutSettings = {
    sheetWidthMm: sanitizeSize(inputSettings.sheetWidthMm, 2750),
    sheetHeightMm: sanitizeSize(inputSettings.sheetHeightMm, 1830),
    sawKerfMm: Math.max(0, inputSettings.sawKerfMm),
    edgeBandingMm: Math.max(0, inputSettings.edgeBandingMm),
    wasteTargetPercent: Math.max(0, inputSettings.wasteTargetPercent),
  };

  const expanded: ExpandedPiece[] = [];

  for (const piece of pieces) {
    const qty = Math.max(0, Math.floor(piece.qty));
    const widthMm = Math.max(1, Math.floor(piece.widthMm));
    const heightMm = Math.max(1, Math.floor(piece.heightMm));
    for (let index = 0; index < qty; index += 1) {
      expanded.push({
        id: `${piece.label}-${index + 1}`,
        label: piece.label,
        widthMm,
        heightMm,
      });
    }
  }

  expanded.sort((left, right) => {
    const areaDiff = right.widthMm * right.heightMm - left.widthMm * left.heightMm;
    if (areaDiff !== 0) return areaDiff;
    return Math.max(right.widthMm, right.heightMm) - Math.max(left.widthMm, left.heightMm);
  });

  const sheets: SheetState[] = [];
  const unplaced: string[] = [];

  for (const piece of expanded) {
    const candidateSizes = [
      {
        rotated: false,
        widthMm: piece.widthMm + settings.edgeBandingMm * 2,
        heightMm: piece.heightMm + settings.edgeBandingMm * 2,
      },
      {
        rotated: true,
        widthMm: piece.heightMm + settings.edgeBandingMm * 2,
        heightMm: piece.widthMm + settings.edgeBandingMm * 2,
      },
    ];

    let selected:
      | {
          sheetIndex: number;
          freeRectIndex: number;
          rotated: boolean;
          widthMm: number;
          heightMm: number;
          score: number;
        }
      | undefined;

    const availableSheets = sheets.length > 0 ? sheets : [createSheet(settings.sheetWidthMm, settings.sheetHeightMm)];
    if (sheets.length === 0) {
      sheets.push(availableSheets[0]);
    }

    for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex += 1) {
      const sheet = sheets[sheetIndex];
      for (let freeRectIndex = 0; freeRectIndex < sheet.freeRects.length; freeRectIndex += 1) {
        const rect = sheet.freeRects[freeRectIndex];
        for (const candidate of candidateSizes) {
          if (candidate.widthMm > rect.widthMm || candidate.heightMm > rect.heightMm) {
            continue;
          }
          const score = rect.widthMm * rect.heightMm - candidate.widthMm * candidate.heightMm;
          if (!selected || score < selected.score) {
            selected = {
              sheetIndex,
              freeRectIndex,
              rotated: candidate.rotated,
              widthMm: candidate.widthMm,
              heightMm: candidate.heightMm,
              score,
            };
          }
        }
      }
    }

    if (!selected) {
      const newSheet = createSheet(settings.sheetWidthMm, settings.sheetHeightMm);
      sheets.push(newSheet);
      const fitsDirectly = candidateSizes.find(
        (candidate) =>
          candidate.widthMm <= settings.sheetWidthMm && candidate.heightMm <= settings.sheetHeightMm,
      );

      if (!fitsDirectly) {
        unplaced.push(piece.label);
        sheets.pop();
        continue;
      }

      selected = {
        sheetIndex: sheets.length - 1,
        freeRectIndex: 0,
        rotated: fitsDirectly.rotated,
        widthMm: fitsDirectly.widthMm,
        heightMm: fitsDirectly.heightMm,
        score: 0,
      };
    }

    const targetSheet = sheets[selected.sheetIndex];
    const targetRect = targetSheet.freeRects[selected.freeRectIndex];
    const placement: Placement = {
      id: piece.id,
      label: piece.label,
      xMm: targetRect.x,
      yMm: targetRect.y,
      widthMm: selected.rotated ? piece.heightMm : piece.widthMm,
      heightMm: selected.rotated ? piece.widthMm : piece.heightMm,
      cutWidthMm: selected.widthMm,
      cutHeightMm: selected.heightMm,
      rotated: selected.rotated,
    };

    targetSheet.placements.push(placement);
    targetSheet.freeRects.splice(selected.freeRectIndex, 1, ...splitRect(targetRect, selected.widthMm, selected.heightMm, settings.sawKerfMm));
  }

  const sheetAreaMm2 = settings.sheetWidthMm * settings.sheetHeightMm;
  const layouts: SheetLayout[] = sheets.map((sheet, index) => {
    const usedAreaMm2 = sheet.placements.reduce(
      (sum, placement) => sum + placement.widthMm * placement.heightMm,
      0,
    );
    const utilization = sheetAreaMm2 > 0 ? (usedAreaMm2 / sheetAreaMm2) * 100 : 0;
    return {
      index,
      placements: sheet.placements,
      usedAreaMm2,
      wastePercent: Math.max(0, 100 - utilization),
      utilizationPercent: utilization,
    };
  });

  const totalAreaMm2 = expanded.reduce((sum, piece) => sum + piece.widthMm * piece.heightMm, 0);
  const totalCutAreaMm2 = layouts.reduce(
    (sum, sheet) =>
      sum +
      sheet.placements.reduce(
        (sheetSum, placement) => sheetSum + placement.cutWidthMm * placement.cutHeightMm,
        0,
      ),
    0,
  );
  const usedSheetAreaMm2 = sheetAreaMm2 * layouts.length;
  const utilizationPercent = usedSheetAreaMm2 > 0 ? (totalAreaMm2 / usedSheetAreaMm2) * 100 : 0;

  return {
    layouts,
    totalAreaMm2,
    totalCutAreaMm2,
    totalSheets: layouts.length,
    wastePercent: Math.max(0, 100 - utilizationPercent),
    utilizationPercent,
    unplaced,
  };
}
