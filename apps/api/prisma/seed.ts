import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('nexus123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@nexuswood.com' },
    update: {
      name: 'Admin Nexus',
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      id: 'user-admin-nexus',
      email: 'admin@nexuswood.com',
      name: 'Admin Nexus',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'nexus-demo' },
    update: {
      name: 'Nexus Demo',
      description: 'Workspace demo da fase 1 da plataforma Nexus Wood AI 2.0.',
    },
    create: {
      id: 'ws-nexus-demo',
      name: 'Nexus Demo',
      slug: 'nexus-demo',
      description: 'Workspace demo da fase 1 da plataforma Nexus Wood AI 2.0.',
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    update: { role: 'ADMIN' },
    create: {
      id: 'wm-admin-nexus-demo',
      workspaceId: workspace.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeWorkspaceId: workspace.id },
  });

  const stages = [
    ['DRAFT', 'Rascunho', 0, 'zinc'],
    ['APPROVED', 'Aprovado', 1, 'sky'],
    ['CUTTING', 'Corte', 2, 'amber'],
    ['EDGE_BANDING', 'Fita de Borda', 3, 'fuchsia'],
    ['ASSEMBLY', 'Montagem', 4, 'violet'],
    ['DELIVERED', 'Entregue', 5, 'emerald'],
  ] as const;

  for (const [key, label, orderIndex, color] of stages) {
    await prisma.workflowStage.upsert({
      where: { workspaceId_key: { workspaceId: workspace.id, key } },
      update: { label, orderIndex, color },
      create: {
        id: `stage-${key.toLowerCase()}`,
        workspaceId: workspace.id,
        key,
        label,
        orderIndex,
        color,
      },
    });
  }

  const materialCategory = await prisma.materialCategory.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'MDF' } },
    update: {},
    create: {
      id: 'mat-cat-mdf',
      workspaceId: workspace.id,
      name: 'MDF',
      description: 'Painéis em MDF para marcenaria sob medida.',
    },
  });

  const hardwareCategory = await prisma.hardwareCategory.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'Ferragens Premium' } },
    update: {},
    create: {
      id: 'hw-cat-premium',
      workspaceId: workspace.id,
      name: 'Ferragens Premium',
      description: 'Ferragens e acessórios base para projetos demo.',
    },
  });

  const materials = await Promise.all([
    prisma.material.upsert({
      where: { id: 'mat-mdf-branco-18' },
      update: {},
      create: {
        id: 'mat-mdf-branco-18',
        workspaceId: workspace.id,
        categoryId: materialCategory.id,
        name: 'MDF Branco TX 18mm',
        manufacturer: 'Eucatex',
        group: 'Painel',
        color: 'Branco Texturizado',
        grainDirection: 'Vertical',
        thicknessMm: 18,
        sheetWidthMm: 2750,
        sheetHeightMm: 1850,
        weightKgM2: 12.6,
        pricePerSheet: 320,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-mdf-carvalho-18' },
      update: {},
      create: {
        id: 'mat-mdf-carvalho-18',
        workspaceId: workspace.id,
        categoryId: materialCategory.id,
        name: 'MDF Carvalho Natural 18mm',
        manufacturer: 'Masisa',
        group: 'Painel',
        color: 'Carvalho Natural',
        grainDirection: 'Horizontal',
        thicknessMm: 18,
        sheetWidthMm: 2750,
        sheetHeightMm: 1850,
        weightKgM2: 12.6,
        pricePerSheet: 380,
      },
    }),
  ]);

  const hardware = await Promise.all([
    prisma.hardware.upsert({
      where: { id: 'hw-dobradica-35' },
      update: {},
      create: {
        id: 'hw-dobradica-35',
        workspaceId: workspace.id,
        categoryId: hardwareCategory.id,
        type: 'Dobradiça',
        name: 'Dobradiça Clip-on 35mm Soft-close',
        manufacturer: 'Blum',
        code: 'BLUMOTION-70T3550',
        measures: '35mm / abertura 110°',
        unitCost: 28.5,
        catalogUrl: 'https://www.blum.com',
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-corredica-500' },
      update: {},
      create: {
        id: 'hw-corredica-500',
        workspaceId: workspace.id,
        categoryId: hardwareCategory.id,
        type: 'Corrediça',
        name: 'Corrediça Telescópica 500mm com Soft-close',
        manufacturer: 'Hafele',
        code: 'HAFELE-423.40.500',
        measures: '500mm / suporte 40kg',
        unitCost: 72,
      },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'Família Silva' } },
    update: {
      companyName: 'Residência Família Silva',
      email: 'familia.silva@example.com',
      phone: '(11) 99999-0000',
    },
    create: {
      id: 'cust-familia-silva',
      workspaceId: workspace.id,
      name: 'Família Silva',
      companyName: 'Residência Família Silva',
      email: 'familia.silva@example.com',
      phone: '(11) 99999-0000',
      contacts: {
        create: [
          {
            id: 'contact-familia-silva-principal',
            name: 'João Silva',
            email: 'familia.silva@example.com',
            phone: '(11) 99999-0000',
            role: 'Responsável',
            isPrimary: true,
          },
        ],
      },
      addresses: {
        create: [
          {
            id: 'address-familia-silva-principal',
            label: 'Residencial',
            street1: 'Rua das Marcenarias, 123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01000-000',
            country: 'BR',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'proj-armario-cozinha-demo' },
    update: {
      workspaceId: workspace.id,
      customerId: customer.id,
      ownerId: user.id,
      name: 'Armário de Cozinha - Família Silva',
      code: 'COZ-001',
      description: 'Cozinha completa em L com torre quente, balcão e paneleiro.',
      status: 'CUTTING',
      widthMm: 4200,
      heightMm: 2700,
      depthMm: 600,
      quotedValue: 18500,
      notes: 'Projeto base para demonstração da Fase 1.',
    },
    create: {
      id: 'proj-armario-cozinha-demo',
      workspaceId: workspace.id,
      customerId: customer.id,
      ownerId: user.id,
      name: 'Armário de Cozinha - Família Silva',
      code: 'COZ-001',
      description: 'Cozinha completa em L com torre quente, balcão e paneleiro.',
      status: 'CUTTING',
      widthMm: 4200,
      heightMm: 2700,
      depthMm: 600,
      quotedValue: 18500,
      notes: 'Projeto base para demonstração da Fase 1.',
    },
  });

  const space = await prisma.projectSpace.upsert({
    where: { id: 'space-cozinha-principal' },
    update: {},
    create: {
      id: 'space-cozinha-principal',
      projectId: project.id,
      name: 'Cozinha Principal',
      code: 'SPACE-1',
      widthMm: 4200,
      heightMm: 2700,
      depthMm: 600,
      notes: 'Ambiente principal do projeto demo.',
    },
  });

  const unit = await prisma.projectUnit.upsert({
    where: { id: 'unit-balcao-cooktop' },
    update: {},
    create: {
      id: 'unit-balcao-cooktop',
      spaceId: space.id,
      name: 'Balcão Cooktop',
      code: 'UNIT-1',
      widthMm: 1800,
      heightMm: 900,
      depthMm: 600,
      notes: 'Módulo inferior com gavetas e portas.',
    },
  });

  const module = await prisma.unitModule.upsert({
    where: { id: 'module-gaveteiro-central' },
    update: {},
    create: {
      id: 'module-gaveteiro-central',
      unitId: unit.id,
      name: 'Gaveteiro Central',
      code: 'MODULE-1',
      notes: 'Conjunto de gavetas com amortecimento.',
    },
  });

  const part = await prisma.part.upsert({
    where: { id: 'part-lateral-esquerda' },
    update: {},
    create: {
      id: 'part-lateral-esquerda',
      moduleId: module.id,
      materialId: materials[0].id,
      name: 'Lateral Esquerda',
      code: 'PART-1',
      type: 'PANEL',
      widthMm: 860,
      heightMm: 560,
      thicknessMm: 18,
      quantity: 1,
      edgeBandTop: 'PVC Branco 1mm',
      edgeBandRight: 'PVC Branco 1mm',
      finish: 'TX',
      notes: 'Peça estrutural principal.',
    },
  });

  await prisma.partHardware.upsert({
    where: { partId_hardwareId: { partId: part.id, hardwareId: hardware[0].id } },
    update: { quantity: 2 },
    create: {
      id: 'part-hardware-dobradica-demo',
      partId: part.id,
      hardwareId: hardware[0].id,
      quantity: 2,
      notes: 'Dobradiças principais da porta.',
    },
  });

  await prisma.projectStageHistory.upsert({
    where: { id: 'history-proj-armario-cozinha-demo' },
    update: {
      workspaceId: workspace.id,
      changedById: user.id,
      status: 'CUTTING',
      note: 'Projeto demo criado no estágio de corte.',
    },
    create: {
      id: 'history-proj-armario-cozinha-demo',
      projectId: project.id,
      workspaceId: workspace.id,
      changedById: user.id,
      stageId: 'stage-cutting',
      status: 'CUTTING',
      note: 'Projeto demo criado no estágio de corte.',
    },
  });

  await prisma.productionTask.upsert({
    where: { id: 'task-proj-armario-cozinha-demo' },
    update: { status: 'IN_PROGRESS' },
    create: {
      id: 'task-proj-armario-cozinha-demo',
      projectId: project.id,
      workspaceId: workspace.id,
      title: 'Confirmar corte das laterais do balcão',
      description: 'Separar peças e validar medidas no plano de corte.',
      status: 'IN_PROGRESS',
      createdById: user.id,
      assignedToId: user.id,
    },
  });

  await prisma.projectNote.upsert({
    where: { id: 'note-proj-armario-cozinha-demo' },
    update: { body: 'Cliente aprovou a composição final e aguarda montagem.' },
    create: {
      id: 'note-proj-armario-cozinha-demo',
      projectId: project.id,
      workspaceId: workspace.id,
      body: 'Cliente aprovou a composição final e aguarda montagem.',
      createdById: user.id,
    },
  });

  await prisma.attachment.upsert({
    where: { id: 'attachment-proj-armario-cozinha-demo' },
    update: { url: 'https://example.com/projeto-demo.pdf' },
    create: {
      id: 'attachment-proj-armario-cozinha-demo',
      projectId: project.id,
      workspaceId: workspace.id,
      name: 'Projeto executivo demo',
      kind: 'DOCUMENT',
      url: 'https://example.com/projeto-demo.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 184320,
      createdById: user.id,
    },
  });

  await prisma.auditEvent.upsert({
    where: { id: 'audit-proj-armario-cozinha-demo' },
    update: { eventType: 'PROJECT_CREATED' },
    create: {
      id: 'audit-proj-armario-cozinha-demo',
      workspaceId: workspace.id,
      projectId: project.id,
      actorId: user.id,
      eventType: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project.id,
      details: { seed: true, code: project.code },
    },
  });

  await prisma.aiHistory.upsert({
    where: { id: 'ai-history-demo' },
    update: { response: 'Sugestão atualizada para aproveitamento de chapas.' },
    create: {
      id: 'ai-history-demo',
      userId: user.id,
      workspaceId: workspace.id,
      projectId: project.id,
      prompt: 'Como otimizar o corte do balcão da cozinha?',
      response: 'Sugestão inicial para otimização de chapas e sequência de usinagem.',
    },
  });

  console.log('Seed concluído: workspace demo, usuário admin, cliente, catálogos e projeto fase 1.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
