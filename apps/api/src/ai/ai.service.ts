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

type AiBudgetSummary = {
  materialCost: number;
  hardwareCost: number;
  laborCost: number;
  installationCost: number;
  transportCost: number;
  marginPercent: number;
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
    const widthMm = this.parseDimension(prompt, [
      'largura',
      'larg',
      'width',
      'l\\b',
    ]);
    const heightMm = this.parseDimension(prompt, [
      'altura',
      'height',
      'h\\b',
    ]);
    const depthMm = this.parseDimension(prompt, [
      'profundidade',
      'prof',
      'depth',
      'p\\b',
    ]);

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

  private engineeringDecisions(request: ParsedRequest): AiEngineeringDecision[] {
    const decisions: AiEngineeringDecision[] = [];
    const maxSpan = request.widthMm / Math.max(request.doorCount, 1);

    if (request.widthMm >= 2000) {
      decisions.push({
        code: 'TOP_THICKNESS_36',
        title: 'Reforço estrutural de tampo',
        detail: 'Largura elevada detectada, recomendado tampo/painéis críticos em 36mm.',
      });
    }
    if (maxSpan >= 900) {
      decisions.push({
        code: 'SHELF_REINFORCEMENT',
        title: 'Reforço para vãos longos',
        detail: 'Vão de prateleira acima do recomendado, inserido reforço longitudinal.',
      });
    }
    if (request.heightMm >= 2400) {
      decisions.push({
        code: 'HIGH_WARDROBE_BRACING',
        title: 'Travamento para altura elevada',
        detail: 'Altura elevada, adicionados travamentos para estabilidade de montagem.',
      });
    }
    if (request.drawerCount >= 6) {
      decisions.push({
        code: 'DRAWER_SLIDE_REINFORCED',
        title: 'Corrediças reforçadas',
        detail: 'Quantidade/largura de gavetas exige corrediças telescópicas reforçadas.',
      });
    }
    if (request.doorCount >= 3) {
      decisions.push({
        code: 'DOOR_HARDWARE_PLUS',
        title: 'Ferragens adicionais de porta',
        detail: 'Configuração com múltiplas portas, aumentando ferragens de apoio e alinhamento.',
      });
    }
    if (decisions.length === 0) {
      decisions.push({
        code: 'STANDARD_ENGINEERING',
        title: 'Engenharia padrão aplicada',
        detail: 'Projeto dentro da faixa padrão com regras de folga, espessura e montagem.',
      });
    }
    return decisions;
  }

  private buildPartSpecs(request: ParsedRequest, panelThicknessMm: number) {
    const innerWidth = Math.max(200, request.widthMm - panelThicknessMm * 2);
    const innerHeight = Math.max(200, request.heightMm - panelThicknessMm * 2);
    const shelfCount = Math.max(2, Math.ceil(request.heightMm / 700));
    const doorWidth = Math.max(260, Math.floor(innerWidth / Math.max(request.doorCount, 1)));
    const drawerFrontHeight = request.drawerCount
      ? Math.max(120, Math.floor(Math.min(request.heightMm * 0.35, 900) / request.drawerCount))
      : 0;

    const specs: Array<{
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
      notes?: string;
    }> = [
      {
        name: 'Lateral esquerda',
        type: 'PANEL',
        widthMm: request.depthMm,
        heightMm: request.heightMm,
        thicknessMm: panelThicknessMm,
        quantity: 1,
      },
      {
        name: 'Lateral direita',
        type: 'PANEL',
        widthMm: request.depthMm,
        heightMm: request.heightMm,
        thicknessMm: panelThicknessMm,
        quantity: 1,
      },
      {
        name: 'Base',
        type: 'PANEL',
        widthMm: innerWidth,
        heightMm: request.depthMm,
        thicknessMm: panelThicknessMm,
        quantity: 1,
      },
      {
        name: 'Topo',
        type: 'PANEL',
        widthMm: innerWidth,
        heightMm: request.depthMm,
        thicknessMm: panelThicknessMm,
        quantity: 1,
      },
      {
        name: 'Fundo',
        type: 'BACK_PANEL',
        widthMm: innerWidth,
        heightMm: innerHeight,
        thicknessMm: 6,
        quantity: 1,
      },
      {
        name: 'Prateleira interna',
        type: 'SHELF',
        widthMm: innerWidth,
        heightMm: Math.max(220, request.depthMm - 20),
        thicknessMm: panelThicknessMm,
        quantity: shelfCount,
      },
    ];

    if (request.doorCount > 0) {
      specs.push({
        name: 'Porta',
        type: 'DOOR',
        widthMm: doorWidth,
        heightMm: Math.max(400, innerHeight - drawerFrontHeight * request.drawerCount),
        thicknessMm: panelThicknessMm,
        quantity: request.doorCount,
        notes: 'Aplicar folga perimetral de 2mm por lado.',
      });
    }

    if (request.drawerCount > 0) {
      specs.push({
        name: 'Frente de gaveta',
        type: 'DRAWER_FRONT',
        widthMm: Math.max(260, innerWidth - 8),
        heightMm: drawerFrontHeight,
        thicknessMm: panelThicknessMm,
        quantity: request.drawerCount,
        notes: 'Frente com folga de 2mm entre módulos.',
      });
    }

    return specs;
  }

  private summarizeBudget(
    request: ParsedRequest,
    partAreaMm2: number,
    materialPricePerSheet: number,
    hardwareCost: number,
  ): AiBudgetSummary {
    const suggestedSheetWidthMm = 2750;
    const suggestedSheetHeightMm = 1830;
    const sheetAreaMm2 = suggestedSheetWidthMm * suggestedSheetHeightMm;
    const utilizationFactor = 1.15;
    const totalSheets = Math.max(
      1,
      Math.ceil((partAreaMm2 * utilizationFactor) / sheetAreaMm2),
    );
    const materialCost = totalSheets * Math.max(1, materialPricePerSheet);
    const laborHours = Math.max(
      6,
      Math.round(request.widthMm / 220 + request.heightMm / 420 + request.drawerCount * 0.6),
    );
    const laborCost = laborHours * 85;
    const installationCost = Math.max(260, request.widthMm * 0.35);
    const transportCost = Math.max(140, request.widthMm * 0.18);
    const marginPercent = 28;
    const subtotal = materialCost + hardwareCost + laborCost + installationCost + transportCost;
    const finalPrice = subtotal * (1 + marginPercent / 100);

    return {
      materialCost,
      hardwareCost,
      laborCost,
      installationCost,
      transportCost,
      marginPercent,
      finalPrice,
    };
  }

  private summarizeCutPlan(partAreaMm2: number): AiCutPlanSummary {
    const suggestedSheetWidthMm = 2750;
    const suggestedSheetHeightMm = 1830;
    const sheetAreaMm2 = suggestedSheetWidthMm * suggestedSheetHeightMm;
    const totalSheets = Math.max(1, Math.ceil((partAreaMm2 * 1.15) / sheetAreaMm2));
    const utilizationPercent = Math.min(
      96,
      (partAreaMm2 / (totalSheets * sheetAreaMm2)) * 100,
    );
    return {
      totalParts: Math.max(1, Math.round(partAreaMm2 / 600000)),
      totalSheets,
      utilizationPercent,
      wastePercent: Math.max(0, 100 - utilizationPercent),
      suggestedSheetWidthMm,
      suggestedSheetHeightMm,
    };
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
      const decisions = this.engineeringDecisions(parsed);
      const panelThicknessMm = decisions.some(
        (item) => item.code === 'TOP_THICKNESS_36',
      )
        ? 36
        : 18;

      const material = await this.prisma.material.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { updatedAt: 'desc' },
      });
      const hingeHardware = await this.prisma.hardware.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [{ type: { contains: 'dobradi', mode: 'insensitive' } }, { name: { contains: 'dobradi', mode: 'insensitive' } }],
        },
      });
      const drawerHardware = await this.prisma.hardware.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [{ type: { contains: 'corredi', mode: 'insensitive' } }, { name: { contains: 'corredi', mode: 'insensitive' } }],
        },
      });

      const partSpecs = this.buildPartSpecs(parsed, panelThicknessMm);
      const partAreaMm2 = partSpecs.reduce(
        (sum, item) => sum + item.widthMm * item.heightMm * item.quantity,
        0,
      );
      const totalHardwareCost =
        (hingeHardware?.unitCost ?? 0) * Math.max(2, parsed.doorCount * 2) +
        (drawerHardware?.unitCost ?? 0) * parsed.drawerCount;
      const budget = this.summarizeBudget(
        parsed,
        partAreaMm2,
        material?.pricePerSheet ?? 290,
        totalHardwareCost,
      );
      const cutPlan = this.summarizeCutPlan(partAreaMm2);
      const productionEstimateHours = Math.max(
        8,
        Math.round(
          parsed.widthMm / 180 +
            parsed.heightMm / 450 +
            parsed.drawerCount * 0.7 +
            parsed.doorCount * 0.35,
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

      const created = await this.prisma.$transaction(async (transaction) => {
        const project = await transaction.project.create({
          data: {
            workspaceId: workspace.id,
            customerId: ensuredCustomer.id,
            ownerId: userId,
            name: parsed.projectName,
            code: `IA-${Date.now().toString().slice(-6)}`,
            description: `Projeto ${parsed.furnitureType} gerado automaticamente por IA.`,
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
        for (const item of partSpecs) {
          const part = await transaction.part.create({
            data: {
              moduleId: module.id,
              materialId: material?.id,
              name: item.name,
              code: `PART-${partIndex}`,
              type: item.type,
              widthMm: item.widthMm,
              heightMm: item.heightMm,
              thicknessMm: item.thicknessMm,
              quantity: item.quantity,
              edgeBandTop: 'PVC 1mm',
              edgeBandRight: 'PVC 1mm',
              edgeBandBottom: 'PVC 1mm',
              edgeBandLeft: 'PVC 1mm',
              notes: item.notes,
            },
          });
          partIndex += 1;

          if (item.type === 'DOOR' && hingeHardware) {
            await transaction.partHardware.create({
              data: {
                partId: part.id,
                hardwareId: hingeHardware.id,
                quantity: Math.max(2, Math.ceil(parsed.heightMm / 800)),
              },
            });
          }
          if (item.type === 'DRAWER_FRONT' && drawerHardware) {
            await transaction.partHardware.create({
              data: {
                partId: part.id,
                hardwareId: drawerHardware.id,
                quantity: 1,
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
              'Decisões técnicas da IA:',
              ...decisions.map((item) => `- [${item.code}] ${item.title}: ${item.detail}`),
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
              'Validar engenharia automática, ferragens e plano de corte antes da aprovação.',
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
          panelThicknessMm,
        },
        engineeringDecisions: decisions,
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
