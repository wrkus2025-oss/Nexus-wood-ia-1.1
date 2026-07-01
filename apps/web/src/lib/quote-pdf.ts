import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type QuoteItem = {
  description: string;
  category: 'material' | 'hardware' | 'labor' | 'other';
  qty: number;
  unitCost: number;
};

type QuotePayload = {
  clientName: string;
  projectName: string;
  marginPercent: number;
  items: QuoteItem[];
};

const CATEGORY_LABEL: Record<QuoteItem['category'], string> = {
  material: 'Materiais',
  hardware: 'Ferragens',
  labor: 'Mão de obra',
  other: 'Outros',
};

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildQuotePdf(payload: QuotePayload) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const totals = payload.items.reduce<Record<QuoteItem['category'], number>>(
    (accumulator, item) => {
      accumulator[item.category] += item.qty * item.unitCost;
      return accumulator;
    },
    { material: 0, hardware: 0, labor: 0, other: 0 },
  );

  const subtotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const marginValue = subtotal * (payload.marginPercent / 100);
  const finalPrice = subtotal + marginValue;

  const drawPageHeader = (currentPage: typeof page) => {
    currentPage.drawRectangle({
      x: 0,
      y: 760,
      width: 595.28,
      height: 82,
      color: rgb(0.05, 0.09, 0.16),
    });
    currentPage.drawText('NEXUS WOOD AI', {
      x: 36,
      y: 804,
      size: 24,
      font: boldFont,
      color: rgb(0.14, 0.92, 0.64),
    });
    currentPage.drawText('Proposta comercial profissional', {
      x: 36,
      y: 786,
      size: 11,
      font: regularFont,
      color: rgb(0.88, 0.9, 0.94),
    });
  };

  const drawSummaryCard = (
    currentPage: typeof page,
    x: number,
    y: number,
    label: string,
    value: string,
  ) => {
    currentPage.drawRectangle({
      x,
      y,
      width: 162,
      height: 58,
      borderWidth: 1,
      borderColor: rgb(0.87, 0.9, 0.94),
      color: rgb(0.98, 0.99, 1),
    });
    currentPage.drawText(label, {
      x: x + 12,
      y: y + 37,
      size: 9,
      font: regularFont,
      color: rgb(0.4, 0.44, 0.52),
    });
    currentPage.drawText(value, {
      x: x + 12,
      y: y + 16,
      size: 16,
      font: boldFont,
      color: rgb(0.05, 0.09, 0.16),
    });
  };

  drawPageHeader(page);

  page.drawText(`Cliente: ${payload.clientName || 'Não informado'}`, {
    x: 36,
    y: 730,
    size: 12,
    font: boldFont,
    color: rgb(0.05, 0.09, 0.16),
  });
  page.drawText(`Projeto: ${payload.projectName || 'Sem nome'}`, {
    x: 36,
    y: 711,
    size: 11,
    font: regularFont,
    color: rgb(0.2, 0.23, 0.29),
  });
  page.drawText(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, {
    x: 36,
    y: 694,
    size: 10,
    font: regularFont,
    color: rgb(0.45, 0.47, 0.52),
  });

  drawSummaryCard(page, 36, 618, 'Materiais', formatCurrency(totals.material));
  drawSummaryCard(page, 216, 618, 'Ferragens', formatCurrency(totals.hardware));
  drawSummaryCard(page, 396, 618, 'Mão de obra', formatCurrency(totals.labor + totals.other));
  drawSummaryCard(page, 36, 548, 'Margem de lucro', `${payload.marginPercent.toFixed(1)}%`);
  drawSummaryCard(page, 216, 548, 'Subtotal', formatCurrency(subtotal));
  drawSummaryCard(page, 396, 548, 'Preço final', formatCurrency(finalPrice));

  page.drawRectangle({
    x: 36,
    y: 509,
    width: 523,
    height: 24,
    color: rgb(0.05, 0.09, 0.16),
  });
  page.drawText('Composição do orçamento', {
    x: 48,
    y: 516,
    size: 11,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let cursorY = 484;
  const rowHeight = 24;

  const ensureRoom = (requiredHeight: number) => {
    if (cursorY - requiredHeight >= 60) {
      return;
    }

    page = pdf.addPage([595.28, 841.89]);
    drawPageHeader(page);
    cursorY = 730;
  };

  const drawRow = (
    description: string,
    category: string,
    quantity: string,
    unitCost: string,
    total: string,
    emphasize = false,
  ) => {
    ensureRoom(rowHeight);
    page.drawRectangle({
      x: 36,
      y: cursorY - 4,
      width: 523,
      height: rowHeight,
      color: emphasize ? rgb(0.95, 0.99, 0.97) : rgb(1, 1, 1),
      borderWidth: 1,
      borderColor: rgb(0.9, 0.92, 0.95),
    });
    const rowFont = emphasize ? boldFont : regularFont;
    page.drawText(description, { x: 44, y: cursorY + 6, size: 9, font: rowFont, color: rgb(0.05, 0.09, 0.16) });
    page.drawText(category, { x: 246, y: cursorY + 6, size: 9, font: rowFont, color: rgb(0.2, 0.23, 0.29) });
    page.drawText(quantity, { x: 346, y: cursorY + 6, size: 9, font: rowFont, color: rgb(0.2, 0.23, 0.29) });
    page.drawText(unitCost, { x: 406, y: cursorY + 6, size: 9, font: rowFont, color: rgb(0.2, 0.23, 0.29) });
    page.drawText(total, { x: 492, y: cursorY + 6, size: 9, font: rowFont, color: rgb(0.05, 0.09, 0.16) });
    cursorY -= rowHeight;
  };

  drawRow('Descrição', 'Categoria', 'Qtd', 'Unit.', 'Total', true);

  payload.items.forEach((item) => {
    drawRow(
      item.description,
      CATEGORY_LABEL[item.category],
      String(item.qty),
      formatCurrency(item.unitCost),
      formatCurrency(item.qty * item.unitCost),
    );
  });

  cursorY -= 12;
  ensureRoom(76);
  page.drawRectangle({
    x: 36,
    y: cursorY - 8,
    width: 523,
    height: 68,
    color: rgb(0.05, 0.09, 0.16),
  });
  page.drawText(`Margem aplicada: ${formatCurrency(marginValue)}`, {
    x: 48,
    y: cursorY + 30,
    size: 12,
    font: regularFont,
    color: rgb(0.88, 0.9, 0.94),
  });
  page.drawText(`Preço final: ${formatCurrency(finalPrice)}`, {
    x: 48,
    y: cursorY + 10,
    size: 18,
    font: boldFont,
    color: rgb(0.14, 0.92, 0.64),
  });

  return pdf.save();
}
