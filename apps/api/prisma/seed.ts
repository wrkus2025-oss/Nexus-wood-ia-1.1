import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Materials: MDF panels
  const materials = await Promise.all([
    prisma.material.upsert({
      where: { id: 'mat-mdf-branco-18' },
      update: {},
      create: {
        id: 'mat-mdf-branco-18',
        name: 'MDF Branco TX 18mm',
        manufacturer: 'Eucatex',
        category: 'MDF',
        thicknessMm: 18,
        color: 'Branco Texturizado',
        grainDirection: 'Vertical',
        weightKgM2: 12.6,
        pricePerSheet: 320.0,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-mdf-cinza-15' },
      update: {},
      create: {
        id: 'mat-mdf-cinza-15',
        name: 'MDF Cinza Cimento 15mm',
        manufacturer: 'Duratex',
        category: 'MDF',
        thicknessMm: 15,
        color: 'Cinza Cimento',
        grainDirection: 'Vertical',
        weightKgM2: 10.5,
        pricePerSheet: 290.0,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-mdf-carvalho-18' },
      update: {},
      create: {
        id: 'mat-mdf-carvalho-18',
        name: 'MDF Carvalho Natural 18mm',
        manufacturer: 'Masisa',
        category: 'MDF',
        thicknessMm: 18,
        color: 'Carvalho Natural',
        grainDirection: 'Horizontal',
        weightKgM2: 12.6,
        pricePerSheet: 380.0,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-mdf-freijo-25' },
      update: {},
      create: {
        id: 'mat-mdf-freijo-25',
        name: 'MDF Freijó 25mm',
        manufacturer: 'Eucatex',
        category: 'MDF',
        thicknessMm: 25,
        color: 'Freijó',
        grainDirection: 'Vertical',
        weightKgM2: 17.5,
        pricePerSheet: 450.0,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-mdf-preto-6' },
      update: {},
      create: {
        id: 'mat-mdf-preto-6',
        name: 'MDF Preto Fosco 6mm',
        manufacturer: 'Duratex',
        category: 'MDF',
        thicknessMm: 6,
        color: 'Preto Fosco',
        grainDirection: 'Vertical',
        weightKgM2: 4.2,
        pricePerSheet: 150.0,
      },
    }),
  ]);

  // Hardware: dobradiças, corrediças, ferragens
  const hardware = await Promise.all([
    prisma.hardware.upsert({
      where: { id: 'hw-dobradica-35' },
      update: {},
      create: {
        id: 'hw-dobradica-35',
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
      where: { id: 'hw-dobradica-26' },
      update: {},
      create: {
        id: 'hw-dobradica-26',
        type: 'Dobradiça',
        name: 'Dobradiça Clip-on 26mm para porta fina',
        manufacturer: 'Blum',
        code: 'BLUMOTION-70T2650',
        measures: '26mm / abertura 110°',
        unitCost: 24.0,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-corredica-400' },
      update: {},
      create: {
        id: 'hw-corredica-400',
        type: 'Corrediça',
        name: 'Corrediça Telescópica 400mm com Soft-close',
        manufacturer: 'Hafele',
        code: 'HAFELE-423.40.400',
        measures: '400mm / suporte 40kg',
        unitCost: 65.0,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-corredica-500' },
      update: {},
      create: {
        id: 'hw-corredica-500',
        type: 'Corrediça',
        name: 'Corrediça Telescópica 500mm com Soft-close',
        manufacturer: 'Hafele',
        code: 'HAFELE-423.40.500',
        measures: '500mm / suporte 40kg',
        unitCost: 72.0,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-puxador-128' },
      update: {},
      create: {
        id: 'hw-puxador-128',
        type: 'Puxador',
        name: 'Puxador Tubular Inox 128mm',
        manufacturer: 'Zamac',
        code: 'ZMC-TUB-128-IN',
        measures: '128mm entre furos / Ø12mm',
        unitCost: 18.9,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-trilho-aramado' },
      update: {},
      create: {
        id: 'hw-trilho-aramado',
        type: 'Corrediça',
        name: 'Trilho Aramado para Gaveta 45cm',
        manufacturer: 'Metaltru',
        code: 'MTL-TRA-450',
        measures: '450mm / suporte 25kg',
        unitCost: 38.0,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-parafuso-tirante' },
      update: {},
      create: {
        id: 'hw-parafuso-tirante',
        type: 'Fixação',
        name: 'Parafuso Tirante M6 x 32mm',
        manufacturer: 'Hafele',
        code: 'HAFELE-TIRANTE-M6',
        measures: 'M6 x 32mm',
        unitCost: 1.2,
      },
    }),
    prisma.hardware.upsert({
      where: { id: 'hw-suporte-prateleira' },
      update: {},
      create: {
        id: 'hw-suporte-prateleira',
        type: 'Suporte',
        name: 'Suporte de Prateleira Zamac',
        manufacturer: 'Zamac',
        code: 'ZMC-SUP-5MM',
        measures: 'Pino 5mm',
        unitCost: 0.8,
      },
    }),
  ]);

  // Seed user
  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('nexus123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@nexuswood.com' },
    update: {},
    create: {
      email: 'admin@nexuswood.com',
      name: 'Admin Nexus',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Example project: Armário de cozinha
  await prisma.project.upsert({
    where: { id: 'proj-armario-cozinha-demo' },
    update: {},
    create: {
      id: 'proj-armario-cozinha-demo',
      name: 'Armário de Cozinha - Família Silva',
      description:
        'Cozinha completa em L com torre quente, balcão e paneleiro. MDF Branco TX 18mm com puxadores tubulares inox.',
      customer: 'João Silva',
      status: 'PRODUCTION',
      widthMm: 4200,
      heightMm: 2700,
      depthMm: 600,
      ownerId: user.id,
    },
  });

  console.log(
    `Seed concluído: ${materials.length} materiais, ${hardware.length} ferragens, 1 usuário (admin@nexuswood.com / nexus123), 1 projeto exemplo.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
