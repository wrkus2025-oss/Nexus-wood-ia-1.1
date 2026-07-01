import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

type AiTextReason = 'MISSING_INFO' | 'ERROR' | 'EXPLANATION';

type AiTextResponse = {
  kind: 'TEXT';
  reason: AiTextReason;
  message: string;
};

type AiEngineeringDecision = {
  code: string;
  title: string;
  detail: string;
};

type AiCutListItem = {
  name: string;
  type: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  quantity: number;
  edgeBanding: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  grainDirection: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
};

type AiHardwareListItem = {
  type: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes: string;
};

type AiBudgetSummary = {
  boardConsumption: {
    totalAreaM2: number;
    totalSheets: number;
    sheetWidthMm: number;
    sheetHeightMm: number;
    utilizationPercent: number;
  };
  edgeBandingMeters: number;
  materialCost: number;
  edgeBandingCost: number;
  hardwareCost: number;
  laborCost: number;
  installationCost: number;
  transportCost: number;
  marginPercent: number;
  subtotal: number;
  finalPrice: number;
};

type AiCutPlanSummary = {
  totalParts: number;
  totalSheets: number;
  utilizationPercent: number;
  wastePercent: number;
  suggestedSheetWidthMm: number;
  suggestedSheetHeightMm: number;
};

type AiProjectResponse = {
  kind: 'PROJECT';
  projectId: string;
  workspaceId: string;
  projectName: string;
  technicalSummary: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
    doorCount: number;
    drawerCount: number;
    panelThicknessMm: number;
  };
  engineeringDecisions: AiEngineeringDecision[];
  engineeringReport: {
    shelfSagMm: number;
    shelfSagLimitMm: number;
    tabletopThicknessMm: number;
    hingeQuantityPerDoor: number;
    hingePlacementsMm: number[];
    drawerSlideClearanceMm: number;
    doorClearanceMm: number;
    rigidityScore: number;
    rigidityClassification: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendedMaterials: {
    carcass: string;
    shelves: string;
    doors: string;
    drawers: string;
    backPanel: string;
  };
  cutList: AiCutListItem[];
  hardwareList: AiHardwareListItem[];
  budget: AiBudgetSummary;
  cutPlan: AiCutPlanSummary;
  productionEstimateHours: number;
};

type AiAssistResponse = AiTextResponse | AiProjectResponse;

type ParsedRequest = {
  projectName: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  doorCount: number;
  drawerCount: number;
  furnitureType: string;
};

type MaterialSpec = {
  code: string;
  label: string;
  family: 'MDF' | 'MDP' | 'PLYWOOD';
  thicknessMm: number;
  elasticityMpa: number;
  densityKgM3: number;
  pricePerSheet: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  grainDirection: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
};

type BuildSpecsResult = {
  partSpecs: Array<{
    name: string;
    type:
      | 'PANEL'
      | 'SHELF'
      | 'DOOR'
      | 'DRAWER_FRONT'
      | 'BACK_PANEL'
      | 'PARTITION'
      | 'OTHER';
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
    quantity: number;
    edgeBanding: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    grainDirection: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
    notes?: string;
  }>;
  shelfCount: number;
  dividerCount: number;
  doorWidthMm: number;
  doorHeightMm: number;
};

const MATERIAL_LIBRARY: MaterialSpec[] = [
  {
    code: 'MDF-15',
    label: 'MDF 15mm',
    family: 'MDF',
    thicknessMm: 15,
    elasticityMpa: 2600,
    densityKgM3: 730,
    pricePerSheet: 280,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    grainDirection: 'VERTICAL',
  },
  {
    code: 'MDF-18',
    label: 'MDF 18mm',
    family: 'MDF',
    thicknessMm: 18,
    elasticityMpa: 2800,
    densityKgM3: 740,
    pricePerSheet: 320,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    grainDirection: 'VERTICAL',
  },
  {
    code: 'MDF-25',
    label: 'MDF 25mm',
    family: 'MDF',
    thicknessMm: 25,
    elasticityMpa: 3000,
    densityKgM3: 750,
    pricePerSheet: 470,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    grainDirection: 'VERTICAL',
  },
  {
    code: 'MDF-36',
    label: 'MDF 36mm',
    family: 'MDF',
    thicknessMm: 36,
    elasticityMpa: 3200,
    densityKgM3: 760,
    pricePerSheet: 650,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    grainDirection: 'VERTICAL',
  },
  {
    code: 'MDP-18',
    label: 'MDP 18mm',
    family: 'MDP',
    thicknessMm: 18,
    elasticityMpa: 2400,
    densityKgM3: 690,
    pricePerSheet: 280,
    sheetWidthMm: 2750,
    sheetHeightMm: 1830,
    grainDirection: 'HORIZONTAL',
  },
  {
    code: 'PLYWOOD-18',
    label: 'Plywood 18mm',
    family: 'PLYWOOD',
    thicknessMm: 18,
    elasticityMpa: 8500,
    densityKgM3: 620,
    pricePerSheet: 420,
    sheetWidthMm: 2440,
    sheetHeightMm: 1220,
    grainDirection: 'HORIZONTAL',
  },
];

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private parseDimension(prompt: string, candidates: string[]) {
    for (const candidate of candidates) {
      const regex = new RegExp(
        `${candidate}\\s*(?:de|com|:)??\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(mm|cm|m)?`,
        'i',
      );
      const matched = prompt.match(regex);
      if (!matched) {
        continue;
      }
      const raw = Number(matched[1].replace(',', '.'));
      const unit = (matched[2] || 'mm').toLowerCase();
      if (!Number.isFinite(raw) || raw <= 0) {
        continue;
      }
      if (unit === 'm') return Math.round(raw * 1000);
      if (unit === 'cm') return Math.round(raw * 10);
      return Math.round(raw);
    }
    return undefined;
  }

  private parseCompactDimensions(prompt: string) {
    const compact =
      prompt.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})\s*[x×]\s*(\d{3,5})/i) ??
      prompt.match(/(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)\s*[x×]\s*(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)\s*[x×]\s*(\d+(?:[\.,]\d+)?)\s*(mm|cm|m)/i);

    if (!compact) {
      return undefined;
    }

    if (compact.length === 4) {
      return {
        widthMm: Number(compact[1]),
        heightMm: Number(compact[2]),
        depthMm: Number(compact[3]),
      };
    }

    const toMm = (raw: string, unit: string) => {
      const value = Number(raw.replace(',', '.'));
      if (!Number.isFinite(value)) {
        return 0;
      }
      if (unit.toLowerCase() === 'm') return Math.round(value * 1000);
      if (unit.toLowerCase() === 'cm') return Math.round(value * 10);
      return Math.round(value);
    };

    return {
      widthMm: toMm(compact[1], compact[2]),
      heightMm: toMm(compact[3], compact[4]),
      depthMm: toMm(compact[5], compact[6]),
    };
  }

  private parseCount(prompt: string, candidates: string[]) {
    for (const candidate of candidates) {
      const regex = new RegExp(
        `(\\d+)\\s*(?:x\\s*)?${candidate}|${candidate}\\s*(?:de|com|:)??\\s*(\\d+)`,
        'i',
      );
      const matched = prompt.match(regex);
      const value = matched?.[1] ?? matched?.[2];
      if (!value) {
        continue;
      }
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return undefined;
  }

  private parsePrompt(prompt: string): ParsedRequest | undefined {
    const compact = this.parseCompactDimensions(prompt);
    const widthMm =
      compact?.widthMm ??
      this.parseDimension(prompt, ['largura', 'larg', 'width', 'l\\b']);
    const heightMm =
      compact?.heightMm ?? this.parseDimension(prompt, ['altura', 'height', 'h\\b']);
    const depthMm =
      compact?.depthMm ??
      this.parseDimension(prompt, ['profundidade', 'prof', 'depth', 'p\\b']);

    if (!widthMm || !heightMm || !depthMm) {
      return undefined;
    }

    const doorCount = this.parseCount(prompt, ['portas?', 'doors?']) ?? 2;
    const drawerCount = this.parseCount(prompt, ['gavetas?', 'drawers?']) ?? 0;

    const furnitureType = /guarda-roupa|roupeiro|arm[aá]rio/i.test(prompt)
      ? 'Roupeiro'
      : /cozinha|kitchen/i.test(prompt)
        ? 'Cozinha'
        : /mesa|table/i.test(prompt)
          ? 'Mesa'
          : 'Móvel planejado';

    return {
      projectName: `${furnitureType} gerado por IA`,
      widthMm,
      heightMm,
      depthMm,
      doorCount: Math.max(0, doorCount),
      drawerCount: Math.max(0, drawerCount),
      furnitureType,
    };
  }

  private chooseMaterial(request: ParsedRequest, role: 'carcass' | 'shelf' | 'door' | 'drawer' | 'back') {
    if (role === 'back') {
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-15') ?? MATERIAL_LIBRARY[0];
    }

    if (role === 'drawer') {
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDP-18') ?? MATERIAL_LIBRARY[0];
    }

    if (role === 'door') {
      if (request.heightMm > 2300 || request.widthMm / Math.max(1, request.doorCount) > 550) {
        return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-25') ?? MATERIAL_LIBRARY[0];
      }
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-18') ?? MATERIAL_LIBRARY[0];
    }

    if (role === 'shelf') {
      if (request.widthMm > 2200) {
        return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-36') ?? MATERIAL_LIBRARY[0];
      }
      if (request.widthMm > 1700) {
        return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-25') ?? MATERIAL_LIBRARY[0];
      }
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-18') ?? MATERIAL_LIBRARY[0];
    }

    if (request.widthMm > 2600 || request.heightMm > 2600) {
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-36') ?? MATERIAL_LIBRARY[0];
    }
    if (request.widthMm > 1800 || request.heightMm > 2300) {
      return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-25') ?? MATERIAL_LIBRARY[0];
    }
    return MATERIAL_LIBRARY.find((item) => item.code === 'MDF-18') ?? MATERIAL_LIBRARY[0];
  }

  private calculateShelfSag(
    spanMm: number,
    depthMm: number,
    material: MaterialSpec,
    loadKg = 35,
  ) {
    const thicknessM = material.thicknessMm / 1000;
    const depthM = Math.max(0.15, depthMm / 1000);
    const spanM = Math.max(0.25, spanMm / 1000);
    const elasticityPa = material.elasticityMpa * 1_000_000;
    const inertia = (depthM * Math.pow(thicknessM, 3)) / 12;
    const loadN = loadKg * 9.81;
    const linearLoad = loadN / spanM;
    const deflectionM =
      (5 * linearLoad * Math.pow(spanM, 4)) / (384 * elasticityPa * inertia);
    const sagMm = deflectionM * 1000;
    const limitMm = spanMm / 180;
    return {
      sagMm,
      limitMm,
      requiresReinforcement: sagMm > limitMm,
    };
  }

  private hingeQuantity(doorHeightMm: number) {
    if (doorHeightMm <= 900) return 2;
    if (doorHeightMm <= 1500) return 3;
    if (doorHeightMm <= 2100) return 4;
    return 5;
  }

  private hingePlacements(doorHeightMm: number, qty: number) {
    if (qty <= 1) {
      return [Math.round(doorHeightMm / 2)];
    }
    const topOffset = 100;
    const bottomOffset = Math.max(100, doorHeightMm - 100);
    if (qty === 2) {
      return [topOffset, bottomOffset];
    }
    const usable = Math.max(0, bottomOffset - topOffset);
    const step = usable / (qty - 1);
    return Array.from({ length: qty }).map((_, index) =>
      Math.round(topOffset + step * index),
    );
  }

  private rigidityAnalysis(
    request: ParsedRequest,
    dividerCount: number,
    stretcherCount: number,
    hasBackPanel: boolean,
  ) {
    let score = 35;
    if (hasBackPanel) score += 28;
    score += Math.min(20, dividerCount * 8);
    score += Math.min(14, stretcherCount * 7);
    if (request.heightMm > 2500) score -= 16;
    if (request.widthMm > 2200) score -= 12;
    score = Math.max(0, Math.min(100, score));

    const classification =
      score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';

    return {
      score,
      classification,
    } as const;
  }

  private engineeringDecisions(
    request: ParsedRequest,
    shelfSag: { sagMm: number; limitMm: number; requiresReinforcement: boolean },
    tabletopThicknessMm: number,
    hingePerDoor: number,
    rigidity: { score: number; classification: 'LOW' | 'MEDIUM' | 'HIGH' },
  ): AiEngineeringDecision[] {
    const decisions: AiEngineeringDecision[] = [];

    decisions.push({
      code: `TOP_THICKNESS_${tabletopThicknessMm}`,
      title: 'Cálculo de espessura estrutural do tampo',
      detail: `Tampo calculado em ${tabletopThicknessMm}mm com base no vão principal e na carga de uso do módulo.`,
    });

    if (shelfSag.requiresReinforcement) {
      decisions.push({
        code: 'SHELF_REINFORCEMENT',
        title: 'Reforço de prateleiras por flecha',
        detail: `Flecha estimada de ${shelfSag.sagMm.toFixed(2)}mm acima do limite ${shelfSag.limitMm.toFixed(2)}mm. Divisórias e travessas extras foram adicionadas.`,
      });
    } else {
      decisions.push({
        code: 'SHELF_SAG_OK',
        title: 'Validação de flecha de prateleira',
        detail: `Flecha estimada de ${shelfSag.sagMm.toFixed(2)}mm dentro do limite de ${shelfSag.limitMm.toFixed(2)}mm.`,
      });
    }

    decisions.push({
      code: 'HINGE_AUTOCALC',
      title: 'Quantidade e posição de dobradiças',
      detail: `Cada porta recebeu ${hingePerDoor} dobradiças conforme altura e distribuição técnica automática.`,
    });

    decisions.push({
      code: `RIGIDITY_${rigidity.classification}`,
      title: 'Análise de rigidez do gabinete',
      detail: `Índice de rigidez ${rigidity.score}/100 (${rigidity.classification}).`,
    });

    if (request.drawerCount > 0) {
      decisions.push({
        code: 'DRAWER_CLEARANCE_CONTROL',
        title: 'Folga técnica de gavetas',
        detail:
          'Corrediças calculadas com folga lateral total de 26mm para estabilidade e extração total.',
      });
    }

    return decisions;
  }

  private buildPartSpecs(
    request: ParsedRequest,
    carcassMaterial: MaterialSpec,
    shelfMaterial: MaterialSpec,
    doorMaterial: MaterialSpec,
    drawerMaterial: MaterialSpec,
    backMaterial: MaterialSpec,
    shelfSag: { requiresReinforcement: boolean },
  ): BuildSpecsResult {
    const panelThicknessMm = carcassMaterial.thicknessMm;
    const innerWidth = Math.max(200, request.widthMm - panelThicknessMm * 2);
    const innerHeight = Math.max(200, request.heightMm - panelThicknessMm * 2);
    const shelfCount = Math.max(2, Math.ceil(request.heightMm / 700));
    const dividerCount =
      request.widthMm >= 1600 || shelfSag.requiresReinforcement ? Math.max(1, Math.floor(request.widthMm / 1200)) : 0;
    const compartmentCount = Math.max(1, dividerCount + 1);
    const compartmentWidth = Math.floor(innerWidth / compartmentCount);
    const doorClearanceMm = 2;
    const doorWidthMm =
      request.doorCount > 0
        ? Math.max(
            240,
            Math.floor(
              (innerWidth - (request.doorCount + 1) * doorClearanceMm) /
                Math.max(1, request.doorCount),
            ),
          )
        : 0;
    const drawerZoneHeightMm =
      request.drawerCount > 0
        ? Math.min(Math.floor(request.heightMm * 0.38), 950)
        : 0;
    const drawerFrontHeight =
      request.drawerCount > 0
        ? Math.max(
            120,
            Math.floor((drawerZoneHeightMm - request.drawerCount * 2) / request.drawerCount),
          )
        : 0;
    const doorHeightMm = Math.max(
      350,
      innerHeight - drawerZoneHeightMm - doorClearanceMm * 2,
    );

    const edgeVisible = 'PVC 1mm';
    const edgeNone = 'Sem fita';

    const partSpecs: BuildSpecsResult['partSpecs'] = [
      {
        name: 'Lateral esquerda',
        type: 'PANEL',
        widthMm: request.depthMm,
        heightMm: request.heightMm,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeVisible,
          right: edgeNone,
          bottom: edgeVisible,
          left: edgeNone,
        },
        grainDirection: 'VERTICAL',
      },
      {
        name: 'Lateral direita',
        type: 'PANEL',
        widthMm: request.depthMm,
        heightMm: request.heightMm,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeVisible,
          right: edgeNone,
          bottom: edgeVisible,
          left: edgeNone,
        },
        grainDirection: 'VERTICAL',
      },
      {
        name: 'Topo',
        type: 'PANEL',
        widthMm: innerWidth,
        heightMm: request.depthMm,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeVisible,
          right: edgeVisible,
          bottom: edgeNone,
          left: edgeVisible,
        },
        grainDirection: 'HORIZONTAL',
      },
      {
        name: 'Base',
        type: 'PANEL',
        widthMm: innerWidth,
        heightMm: request.depthMm,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeVisible,
          right: edgeVisible,
          bottom: edgeNone,
          left: edgeVisible,
        },
        grainDirection: 'HORIZONTAL',
      },
      {
        name: 'Travessa frontal superior',
        type: 'OTHER',
        widthMm: innerWidth,
        heightMm: 100,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeVisible,
          right: edgeNone,
          bottom: edgeNone,
          left: edgeNone,
        },
        grainDirection: 'HORIZONTAL',
      },
      {
        name: 'Travessa traseira superior',
        type: 'OTHER',
        widthMm: innerWidth,
        heightMm: 100,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeNone,
          right: edgeNone,
          bottom: edgeNone,
          left: edgeNone,
        },
        grainDirection: 'HORIZONTAL',
      },
      {
        name: 'Fundo estrutural',
        type: 'BACK_PANEL',
        widthMm: innerWidth,
        heightMm: innerHeight,
        thicknessMm: backMaterial.thicknessMm,
        quantity: 1,
        edgeBanding: {
          top: edgeNone,
          right: edgeNone,
          bottom: edgeNone,
          left: edgeNone,
        },
        grainDirection: 'VERTICAL',
      },
      {
        name: 'Prateleira interna',
        type: 'SHELF',
        widthMm: compartmentWidth,
        heightMm: Math.max(220, request.depthMm - 20),
        thicknessMm: shelfMaterial.thicknessMm,
        quantity: shelfCount * compartmentCount,
        edgeBanding: {
          top: edgeVisible,
          right: edgeNone,
          bottom: edgeNone,
          left: edgeNone,
        },
        grainDirection: 'HORIZONTAL',
      },
    ];

    if (dividerCount > 0) {
      partSpecs.push({
        name: 'Divisória vertical',
        type: 'PARTITION',
        widthMm: request.depthMm - 20,
        heightMm: innerHeight,
        thicknessMm: carcassMaterial.thicknessMm,
        quantity: dividerCount,
        edgeBanding: {
          top: edgeVisible,
          right: edgeNone,
          bottom: edgeVisible,
          left: edgeNone,
        },
        grainDirection: 'VERTICAL',
      });
    }

    if (request.doorCount > 0) {
      partSpecs.push({
        name: 'Porta',
        type: 'DOOR',
        widthMm: doorWidthMm,
        heightMm: doorHeightMm,
        thicknessMm: doorMaterial.thicknessMm,
        quantity: request.doorCount,
        edgeBanding: {
          top: edgeVisible,
          right: edgeVisible,
          bottom: edgeVisible,
          left: edgeVisible,
        },
        grainDirection: 'VERTICAL',
        notes: 'Folga perimetral 2mm e regulagem em dobradiças 35mm.',
      });
    }

    if (request.drawerCount > 0) {
      const drawerWidthMm = Math.max(260, compartmentWidth - 26);
      const drawerDepthMm = Math.max(350, request.depthMm - 70);
      partSpecs.push(
        {
          name: 'Frente de gaveta',
          type: 'DRAWER_FRONT',
          widthMm: drawerWidthMm,
          heightMm: drawerFrontHeight,
          thicknessMm: doorMaterial.thicknessMm,
          quantity: request.drawerCount,
          edgeBanding: {
            top: edgeVisible,
            right: edgeVisible,
            bottom: edgeVisible,
            left: edgeVisible,
          },
          grainDirection: 'HORIZONTAL',
          notes: 'Folga entre frentes de 2mm.',
        },
        {
          name: 'Lateral de gaveta',
          type: 'OTHER',
          widthMm: drawerDepthMm,
          heightMm: Math.max(120, drawerFrontHeight - 26),
          thicknessMm: drawerMaterial.thicknessMm,
          quantity: request.drawerCount * 2,
          edgeBanding: {
            top: edgeNone,
            right: edgeNone,
            bottom: edgeNone,
            left: edgeNone,
          },
          grainDirection: 'HORIZONTAL',
        },
        {
          name: 'Traseiro de gaveta',
          type: 'OTHER',
          widthMm: Math.max(220, drawerWidthMm - drawerMaterial.thicknessMm * 2),
          heightMm: Math.max(100, drawerFrontHeight - 30),
          thicknessMm: drawerMaterial.thicknessMm,
          quantity: request.drawerCount,
          edgeBanding: {
            top: edgeNone,
            right: edgeNone,
            bottom: edgeNone,
            left: edgeNone,
          },
          grainDirection: 'HORIZONTAL',
        },
        {
          name: 'Fundo de gaveta',
          type: 'OTHER',
          widthMm: Math.max(220, drawerWidthMm - 20),
          heightMm: Math.max(220, drawerDepthMm - 30),
          thicknessMm: 15,
          quantity: request.drawerCount,
          edgeBanding: {
            top: edgeNone,
            right: edgeNone,
            bottom: edgeNone,
            left: edgeNone,
          },
          grainDirection: 'NONE',
        },
      );
    }

    return {
      partSpecs,
      shelfCount,
      dividerCount,
      doorWidthMm,
      doorHeightMm,
    };
  }

  private summarizeBudget(
    request: ParsedRequest,
    cutList: AiCutListItem[],
    boardMaterial: MaterialSpec,
    hardwareList: AiHardwareListItem[],
  ): AiBudgetSummary {
    const partAreaMm2 = cutList.reduce(
      (sum, item) => sum + item.widthMm * item.heightMm * item.quantity,
      0,
    );
    const totalAreaM2 = partAreaMm2 / 1_000_000;
    const sheetAreaM2 =
      (boardMaterial.sheetWidthMm * boardMaterial.sheetHeightMm) / 1_000_000;
    const totalSheets = Math.max(1, Math.ceil((totalAreaM2 * 1.15) / sheetAreaM2));
    const utilizationPercent = Math.min(
      96,
      (totalAreaM2 / (totalSheets * sheetAreaM2)) * 100,
    );

    const edgeBandingMm = cutList.reduce((sum, item) => {
      const perimeterMm =
        (item.edgeBanding.top !== 'Sem fita' ? item.widthMm : 0) +
        (item.edgeBanding.bottom !== 'Sem fita' ? item.widthMm : 0) +
        (item.edgeBanding.left !== 'Sem fita' ? item.heightMm : 0) +
        (item.edgeBanding.right !== 'Sem fita' ? item.heightMm : 0);
      return sum + perimeterMm * Math.max(1, item.quantity);
    }, 0);

    const edgeBandingMeters = edgeBandingMm / 1000;
    const materialCost = totalSheets * boardMaterial.pricePerSheet;
    const edgeBandingCost = edgeBandingMeters * 1.65;
    const hardwareCost = hardwareList.reduce((sum, item) => sum + item.totalCost, 0);
    const laborHours = Math.max(
      8,
      Math.round(
        cutList.length * 0.7 +
          request.doorCount * 0.55 +
          request.drawerCount * 1.15 +
          request.widthMm / 420,
      ),
    );
    const laborCost = laborHours * 92;
    const installationCost = Math.max(320, request.widthMm * 0.36);
    const transportCost = Math.max(180, request.widthMm * 0.2);
    const marginPercent = 28;
    const subtotal =
      materialCost +
      edgeBandingCost +
      hardwareCost +
      laborCost +
      installationCost +
      transportCost;
    const finalPrice = subtotal * (1 + marginPercent / 100);

    return {
      boardConsumption: {
        totalAreaM2,
        totalSheets,
        sheetWidthMm: boardMaterial.sheetWidthMm,
        sheetHeightMm: boardMaterial.sheetHeightMm,
        utilizationPercent,
      },
      edgeBandingMeters,
      materialCost,
      edgeBandingCost,
      hardwareCost,
      laborCost,
      installationCost,
      transportCost,
      marginPercent,
      subtotal,
      finalPrice,
    };
  }

  private summarizeCutPlan(cutList: AiCutListItem[]): AiCutPlanSummary {
    const partAreaMm2 = cutList.reduce(
      (sum, item) => sum + item.widthMm * item.heightMm * item.quantity,
      0,
    );
    const suggestedSheetWidthMm = 2750;
    const suggestedSheetHeightMm = 1830;
    const sheetAreaMm2 = suggestedSheetWidthMm * suggestedSheetHeightMm;
    const totalSheets = Math.max(1, Math.ceil((partAreaMm2 * 1.15) / sheetAreaMm2));
    const utilizationPercent = Math.min(
      96,
      (partAreaMm2 / (totalSheets * sheetAreaMm2)) * 100,
    );
    return {
      totalParts: cutList.reduce((sum, item) => sum + item.quantity, 0),
      totalSheets,
      utilizationPercent,
      wastePercent: Math.max(0, 100 - utilizationPercent),
      suggestedSheetWidthMm,
      suggestedSheetHeightMm,
    };
  }

  private async resolveMaterialIdForThickness(
    workspaceId: string,
    label: string,
    thicknessMm: number,
  ) {
    const material = await this.prisma.material.findFirst({
      where: {
        workspaceId,
        thicknessMm,
        OR: [
          { name: { contains: label.split(' ')[0], mode: 'insensitive' } },
          { group: { contains: label.split(' ')[0], mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (material) {
      return material.id;
    }

    const fallback = await this.prisma.material.findFirst({
      where: { workspaceId, thicknessMm },
      orderBy: { updatedAt: 'desc' },
    });

    return fallback?.id;
  }

  async ask(userId: string, prompt: string): Promise<AiAssistResponse> {
    const { workspace } =
      await this.workspacesService.getActiveMembershipOrThrow(userId);
    const normalized = prompt.trim().toLowerCase();
    const shouldExplain =
      /\b(explica|explique|explain|como funciona|why|porque)\b/i.test(
        normalized,
      );

    if (shouldExplain) {
      const response: AiTextResponse = {
        kind: 'TEXT',
        reason: 'EXPLANATION',
        message:
          'Posso explicar o processo técnico. Para gerar o projeto 3D automático, informe largura, altura, profundidade e configuração de portas/gavetas.',
      };
      await this.prisma.aiHistory.create({
        data: {
          userId,
          workspaceId: workspace.id,
          prompt,
          response: JSON.stringify(response),
        },
      });
      return response;
    }

    const parsed = this.parsePrompt(prompt);
    if (!parsed) {
      const response: AiTextResponse = {
        kind: 'TEXT',
        reason: 'MISSING_INFO',
        message:
          'Para gerar o projeto 3D preciso de largura, altura e profundidade (ex.: 2400mm x 2300mm x 600mm), além de portas/gavetas desejadas.',
      };
      await this.prisma.aiHistory.create({
        data: {
          userId,
          workspaceId: workspace.id,
          prompt,
          response: JSON.stringify(response),
        },
      });
      return response;
    }

    try {
      const carcassMaterial = this.chooseMaterial(parsed, 'carcass');
      const shelfMaterial = this.chooseMaterial(parsed, 'shelf');
      const doorMaterial = this.chooseMaterial(parsed, 'door');
      const drawerMaterial = this.chooseMaterial(parsed, 'drawer');
      const backMaterial = this.chooseMaterial(parsed, 'back');

      const estimatedShelfSpan = Math.floor(parsed.widthMm / Math.max(1, parsed.doorCount));
      const shelfSag = this.calculateShelfSag(
        estimatedShelfSpan,
        parsed.depthMm,
        shelfMaterial,
      );
      const tabletopThicknessMm = parsed.widthMm > 2400 ? 36 : parsed.widthMm > 1700 ? 25 : 18;

      const specsResult = this.buildPartSpecs(
        parsed,
        carcassMaterial,
        shelfMaterial,
        doorMaterial,
        drawerMaterial,
        backMaterial,
        shelfSag,
      );

      const hingeQuantityPerDoor = this.hingeQuantity(specsResult.doorHeightMm || parsed.heightMm);
      const hingePlacementsMm = this.hingePlacements(specsResult.doorHeightMm || parsed.heightMm, hingeQuantityPerDoor);
      const rigidity = this.rigidityAnalysis(
        parsed,
        specsResult.dividerCount,
        2,
        true,
      );
      const decisions = this.engineeringDecisions(
        parsed,
        shelfSag,
        tabletopThicknessMm,
        hingeQuantityPerDoor,
        rigidity,
      );

      const hingeHardware = await this.prisma.hardware.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { type: { contains: 'dobradi', mode: 'insensitive' } },
            { name: { contains: 'dobradi', mode: 'insensitive' } },
          ],
        },
      });
      const drawerHardware = await this.prisma.hardware.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { type: { contains: 'corredi', mode: 'insensitive' } },
            { name: { contains: 'corredi', mode: 'insensitive' } },
          ],
        },
      });
      const handleHardware = await this.prisma.hardware.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { type: { contains: 'pux', mode: 'insensitive' } },
            { name: { contains: 'pux', mode: 'insensitive' } },
          ],
        },
      });

      const cutList: AiCutListItem[] = specsResult.partSpecs.map((item) => ({
        name: item.name,
        type: item.type,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        thicknessMm: item.thicknessMm,
        quantity: item.quantity,
        edgeBanding: item.edgeBanding,
        grainDirection: item.grainDirection,
      }));

      const hardwareList: AiHardwareListItem[] = [];
      if (parsed.doorCount > 0) {
        hardwareList.push({
          type: 'HINGE',
          name: hingeHardware?.name ?? 'Dobradiça 35mm soft-close',
          quantity: parsed.doorCount * hingeQuantityPerDoor,
          unitCost: hingeHardware?.unitCost ?? 24,
          totalCost: (hingeHardware?.unitCost ?? 24) * parsed.doorCount * hingeQuantityPerDoor,
          notes: `Posições (mm): ${hingePlacementsMm.join(', ')}`,
        });
      }
      if (parsed.drawerCount > 0) {
        hardwareList.push({
          type: 'DRAWER_SLIDE',
          name: drawerHardware?.name ?? 'Corrediça telescópica',
          quantity: parsed.drawerCount,
          unitCost: drawerHardware?.unitCost ?? 68,
          totalCost: (drawerHardware?.unitCost ?? 68) * parsed.drawerCount,
          notes: 'Folga lateral total por gaveta: 26mm',
        });
      }
      hardwareList.push({
        type: 'HANDLE',
        name: handleHardware?.name ?? 'Puxador linear alumínio',
        quantity: Math.max(1, parsed.doorCount + parsed.drawerCount),
        unitCost: handleHardware?.unitCost ?? 18,
        totalCost:
          (handleHardware?.unitCost ?? 18) *
          Math.max(1, parsed.doorCount + parsed.drawerCount),
        notes: 'Aplicação frontal com furação padronizada 96mm.',
      });

      const budget = this.summarizeBudget(
        parsed,
        cutList,
        carcassMaterial,
        hardwareList,
      );
      const cutPlan = this.summarizeCutPlan(cutList);

      const productionEstimateHours = Math.max(
        10,
        Math.round(
          specsResult.partSpecs.length * 0.65 +
            parsed.widthMm / 260 +
            parsed.drawerCount * 1.1 +
            parsed.doorCount * 0.45,
        ),
      );

      const customer = await this.prisma.customer.findFirst({
        where: { workspaceId: workspace.id },
      });

      const ensuredCustomer =
        customer ??
        (await this.prisma.customer.create({
          data: {
            workspaceId: workspace.id,
            name: 'Cliente IA',
            notes: 'Criado automaticamente para projetos gerados por IA',
          },
        }));

      const carcassMaterialId = await this.resolveMaterialIdForThickness(
        workspace.id,
        carcassMaterial.label,
        carcassMaterial.thicknessMm,
      );
      const shelfMaterialId = await this.resolveMaterialIdForThickness(
        workspace.id,
        shelfMaterial.label,
        shelfMaterial.thicknessMm,
      );
      const doorMaterialId = await this.resolveMaterialIdForThickness(
        workspace.id,
        doorMaterial.label,
        doorMaterial.thicknessMm,
      );
      const drawerMaterialId = await this.resolveMaterialIdForThickness(
        workspace.id,
        drawerMaterial.label,
        drawerMaterial.thicknessMm,
      );
      const backMaterialId = await this.resolveMaterialIdForThickness(
        workspace.id,
        backMaterial.label,
        backMaterial.thicknessMm,
      );

      const created = await this.prisma.$transaction(async (transaction) => {
        const project = await transaction.project.create({
          data: {
            workspaceId: workspace.id,
            customerId: ensuredCustomer.id,
            ownerId: userId,
            name: parsed.projectName,
            code: `IA-${Date.now().toString().slice(-6)}`,
            description: `Projeto ${parsed.furnitureType} gerado automaticamente por IA com engenharia profissional.`,
            widthMm: parsed.widthMm,
            heightMm: parsed.heightMm,
            depthMm: parsed.depthMm,
            status: 'DRAFT',
            quotedValue: budget.finalPrice,
            notes: `Gerado por IA com ${parsed.doorCount} portas e ${parsed.drawerCount} gavetas.`,
          },
        });

        const space = await transaction.projectSpace.create({
          data: {
            projectId: project.id,
            name: 'Ambiente principal',
            code: 'SPACE-1',
            widthMm: parsed.widthMm,
            heightMm: parsed.heightMm,
            depthMm: parsed.depthMm,
          },
        });

        const unit = await transaction.projectUnit.create({
          data: {
            spaceId: space.id,
            name: parsed.furnitureType,
            code: 'UNIT-1',
            widthMm: parsed.widthMm,
            heightMm: parsed.heightMm,
            depthMm: parsed.depthMm,
          },
        });

        const module = await transaction.unitModule.create({
          data: {
            unitId: unit.id,
            name: 'Módulo principal',
            code: 'MODULE-1',
            notes: 'Estrutura técnica criada automaticamente pela IA',
          },
        });

        let partIndex = 1;
        for (const item of specsResult.partSpecs) {
          const resolvedMaterialId =
            item.type === 'BACK_PANEL'
              ? backMaterialId
              : item.type === 'DOOR'
                ? doorMaterialId
                : item.type === 'DRAWER_FRONT'
                  ? doorMaterialId
                  : item.name.includes('gaveta')
                    ? drawerMaterialId
                    : item.type === 'SHELF'
                      ? shelfMaterialId
                      : carcassMaterialId;

          const part = await transaction.part.create({
            data: {
              moduleId: module.id,
              materialId: resolvedMaterialId,
              name: item.name,
              code: `PART-${partIndex}`,
              type: item.type,
              widthMm: item.widthMm,
              heightMm: item.heightMm,
              thicknessMm: item.thicknessMm,
              quantity: item.quantity,
              edgeBandTop: item.edgeBanding.top,
              edgeBandRight: item.edgeBanding.right,
              edgeBandBottom: item.edgeBanding.bottom,
              edgeBandLeft: item.edgeBanding.left,
              notes: [
                item.notes,
                `Direção do veio: ${item.grainDirection}`,
              ]
                .filter(Boolean)
                .join(' · '),
            },
          });
          partIndex += 1;

          if (item.type === 'DOOR' && hingeHardware) {
            await transaction.partHardware.create({
              data: {
                partId: part.id,
                hardwareId: hingeHardware.id,
                quantity: hingeQuantityPerDoor,
                notes: `Pontos de furação (mm): ${hingePlacementsMm.join(', ')}`,
              },
            });
          }
          if (item.type === 'DRAWER_FRONT' && drawerHardware) {
            await transaction.partHardware.create({
              data: {
                partId: part.id,
                hardwareId: drawerHardware.id,
                quantity: 1,
                notes: 'Folga lateral total de 26mm para corrediças.',
              },
            });
          }
        }

        await transaction.projectNote.create({
          data: {
            projectId: project.id,
            workspaceId: workspace.id,
            createdById: userId,
            body: [
              'Relatório de engenharia da IA:',
              `- Flecha de prateleira: ${shelfSag.sagMm.toFixed(2)}mm (limite ${shelfSag.limitMm.toFixed(2)}mm)`,
              `- Espessura do tampo: ${tabletopThicknessMm}mm`,
              `- Dobradiças por porta: ${hingeQuantityPerDoor}`,
              `- Folga corrediças: 26mm`,
              `- Folga portas: 2mm por lado`,
              `- Rigidez do gabinete: ${rigidity.score}/100 (${rigidity.classification})`,
              ...decisions.map(
                (item) => `- [${item.code}] ${item.title}: ${item.detail}`,
              ),
            ].join('\n'),
          },
        });

        await transaction.productionTask.create({
          data: {
            projectId: project.id,
            workspaceId: workspace.id,
            createdById: userId,
            title: 'Revisar projeto gerado por IA',
            description:
              'Validar cálculos de engenharia, ferragens, lista de corte e orçamento antes da aprovação.',
          },
        });

        return { project };
      });

      const response: AiProjectResponse = {
        kind: 'PROJECT',
        projectId: created.project.id,
        workspaceId: workspace.id,
        projectName: created.project.name,
        technicalSummary: {
          widthMm: parsed.widthMm,
          heightMm: parsed.heightMm,
          depthMm: parsed.depthMm,
          doorCount: parsed.doorCount,
          drawerCount: parsed.drawerCount,
          panelThicknessMm: carcassMaterial.thicknessMm,
        },
        engineeringDecisions: decisions,
        engineeringReport: {
          shelfSagMm: shelfSag.sagMm,
          shelfSagLimitMm: shelfSag.limitMm,
          tabletopThicknessMm,
          hingeQuantityPerDoor,
          hingePlacementsMm,
          drawerSlideClearanceMm: 26,
          doorClearanceMm: 2,
          rigidityScore: rigidity.score,
          rigidityClassification: rigidity.classification,
        },
        recommendedMaterials: {
          carcass: carcassMaterial.label,
          shelves: shelfMaterial.label,
          doors: doorMaterial.label,
          drawers: drawerMaterial.label,
          backPanel: backMaterial.label,
        },
        cutList,
        hardwareList,
        budget,
        cutPlan,
        productionEstimateHours,
      };

      await this.prisma.aiHistory.create({
        data: {
          userId,
          workspaceId: workspace.id,
          projectId: created.project.id,
          prompt,
          response: JSON.stringify(response),
        },
      });

      return response;
    } catch {
      const response: AiTextResponse = {
        kind: 'TEXT',
        reason: 'ERROR',
        message:
          'Não foi possível gerar o projeto agora. Revise os dados do pedido e tente novamente.',
      };
      await this.prisma.aiHistory.create({
        data: {
          userId,
          workspaceId: workspace.id,
          prompt,
          response: JSON.stringify(response),
        },
      });
      return response;
    }
  }

  async history(userId: string) {
    const { workspace } =
      await this.workspacesService.getActiveMembershipOrThrow(userId);
    return this.prisma.aiHistory.findMany({
      where: { userId, workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
