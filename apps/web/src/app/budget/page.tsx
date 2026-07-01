'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useProject } from '@/lib/hooks';
import { buildQuotePdf, QuoteItem } from '@/lib/quote-pdf';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Material = { id: string; name: string; thicknessMm: number; pricePerSheet: number };
type Hardware = { id: string; name: string; type: string; unitCost: number };
type BudgetItem = QuoteItem;

const INITIAL_ITEMS: BudgetItem[] = [
  { description: 'MDF Branco TX 18mm — chapas', category: 'material', qty: 8, unitCost: 320 },
  { description: 'MDF Preto 6mm — fundos', category: 'material', qty: 2, unitCost: 150 },
  { description: 'Dobradiça Blum soft-close', category: 'hardware', qty: 12, unitCost: 28.5 },
  { description: 'Corrediça telescópica 400mm', category: 'hardware', qty: 4, unitCost: 65 },
  { description: 'Puxador tubular inox', category: 'hardware', qty: 8, unitCost: 18.9 },
  { description: 'Corte, usinagem e montagem', category: 'labor', qty: 1, unitCost: 1200 },
  { description: 'Instalação final', category: 'labor', qty: 1, unitCost: 450 },
];

const CATEGORY_COLOR: Record<BudgetItem['category'], string> = {
  material: 'text-sky-300',
  hardware: 'text-emerald-300',
  labor: 'text-amber-300',
  other: 'text-zinc-300',
};

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BudgetPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<BudgetItem[]>(INITIAL_ITEMS);
  const [marginPercent, setMarginPercent] = useState(32);
  const [projectName, setProjectName] = useState('Armário de Cozinha Premium');
  const [clientName, setClientName] = useState('Família Silva');
  const [isExporting, setIsExporting] = useState(false);

  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });

  const hardwareQuery = useQuery({
    queryKey: ['hardware'],
    queryFn: () => apiFetch<Hardware[]>('/hardware', {}, token ?? undefined),
    enabled: !!token,
  });
  const projectQuery = useProject(token, projectId);

  useEffect(() => {
    if (!projectQuery.data) {
      return;
    }
    const project = projectQuery.data;
    setProjectName(project.name);
    const generatedItems: BudgetItem[] = [];

    const materialGroups = new Map<string, { qty: number; unitCost: number }>();
    const hardwareGroups = new Map<string, { qty: number; unitCost: number }>();
    const parts = project.spaces.flatMap((space) =>
      space.units.flatMap((unit) => unit.modules.flatMap((module) => module.parts)),
    );

    for (const part of parts) {
      const partAreaM2 =
        ((part.widthMm * part.heightMm) / 1_000_000) * Math.max(1, part.quantity);
      if (part.material) {
        const sheetArea =
          ((part.material.sheetWidthMm ?? 2750) * (part.material.sheetHeightMm ?? 1830)) /
          1_000_000;
        const qty = Math.max(1, Math.ceil(partAreaM2 / sheetArea));
        const key = `${part.material.name} ${part.material.thicknessMm}mm`;
        const current = materialGroups.get(key) ?? { qty: 0, unitCost: part.material.pricePerSheet };
        current.qty += qty;
        materialGroups.set(key, current);
      }
      for (const hw of part.hardwareItems) {
        const key = hw.hardware.name;
        const current = hardwareGroups.get(key) ?? { qty: 0, unitCost: hw.hardware.unitCost };
        current.qty += hw.quantity * Math.max(1, part.quantity);
        hardwareGroups.set(key, current);
      }
    }

    for (const [name, item] of materialGroups.entries()) {
      generatedItems.push({
        description: `${name} — chapas`,
        category: 'material',
        qty: item.qty,
        unitCost: item.unitCost,
      });
    }
    for (const [name, item] of hardwareGroups.entries()) {
      generatedItems.push({
        description: name,
        category: 'hardware',
        qty: item.qty,
        unitCost: item.unitCost,
      });
    }
    generatedItems.push({
      description: 'Engenharia, corte, usinagem e montagem',
      category: 'labor',
      qty: 1,
      unitCost: Math.max(1200, parts.length * 85),
    });
    generatedItems.push({
      description: 'Instalação e logística',
      category: 'other',
      qty: 1,
      unitCost: Math.max(450, project.widthMm * 0.5),
    });

    setItems(generatedItems.length > 0 ? generatedItems : INITIAL_ITEMS);
  }, [projectQuery.data]);

  const totalsByCategory = useMemo(
    () =>
      items.reduce<Record<BudgetItem['category'], number>>(
        (accumulator, item) => {
          accumulator[item.category] += item.qty * item.unitCost;
          return accumulator;
        },
        { material: 0, hardware: 0, labor: 0, other: 0 },
      ),
    [items],
  );

  const subtotal = Object.values(totalsByCategory).reduce((sum, value) => sum + value, 0);
  const marginValue = subtotal * (marginPercent / 100);
  const finalPrice = subtotal + marginValue;

  function updateItem(index: number, field: keyof BudgetItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === 'description' || field === 'category'
                  ? value
                  : Math.max(0, Number(value) || 0),
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { description: 'Novo item comercial', category: 'other', qty: 1, unitCost: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function exportPdf() {
    setIsExporting(true);
    try {
      const pdfBytes = await buildQuotePdf({
        clientName,
        projectName,
        marginPercent,
        items,
      });
      const pdfBuffer = Uint8Array.from(pdfBytes).buffer;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nexus-quote-${projectName.toLowerCase().replaceAll(/\s+/g, '-') || 'projeto'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orçamento Comercial</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Gere proposta em PDF com branding Nexus Wood AI, composição de custos e margem final.
          </p>
        </div>
        <button
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          disabled={items.length === 0 || isExporting}
          onClick={exportPdf}
        >
          {isExporting ? 'Gerando PDF...' : 'Exportar cotação em PDF'}
        </button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 font-medium">Dados da proposta</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-zinc-400">Cliente</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-zinc-400">Projeto</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-zinc-400">Margem de lucro (%)</span>
              <input
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                type="number"
                min={0}
                max={200}
                value={marginPercent}
                onChange={(event) => setMarginPercent(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Biblioteca de materiais</p>
              <p className="mt-2 text-lg font-semibold text-zinc-100">{materialsQuery.data?.length ?? 0} itens</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Biblioteca de ferragens</p>
              <p className="mt-2 text-lg font-semibold text-zinc-100">{hardwareQuery.data?.length ?? 0} itens</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            ['Materiais', totalsByCategory.material, 'material'],
            ['Ferragens', totalsByCategory.hardware, 'hardware'],
            ['Mão de obra', totalsByCategory.labor + totalsByCategory.other, 'labor'],
            ['Margem', marginValue, 'other'],
            ['Subtotal', subtotal, 'other'],
            ['Preço final', finalPrice, 'hardware'],
          ].map(([label, value, colorKey]) => (
            <article key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-400">{label}</p>
              <p className={`mt-2 text-xl font-semibold ${CATEGORY_COLOR[colorKey as BudgetItem['category']]}`}>
                {typeof value === 'number' ? formatCurrency(value) : value}
              </p>
            </article>
          ))}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
          <div>
            <h2 className="font-medium">Itens da cotação</h2>
            <p className="text-xs text-zinc-500">
              Materiais, ferragens e mão de obra consolidados para {projectName}.
            </p>
          </div>
          <button
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            onClick={addItem}
          >
            + Item
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Qtd</th>
              <th className="px-4 py-2">Unitário</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="border-t border-zinc-800">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded-lg bg-zinc-950 px-3 py-2"
                    value={item.description}
                    onChange={(event) => updateItem(index, 'description', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded-lg bg-zinc-950 px-3 py-2"
                    value={item.category}
                    onChange={(event) => updateItem(index, 'category', event.target.value)}
                  >
                    <option value="material">Material</option>
                    <option value="hardware">Ferragem</option>
                    <option value="labor">Mão de obra</option>
                    <option value="other">Outro</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-20 rounded-lg bg-zinc-950 px-3 py-2"
                    type="number"
                    min={0}
                    value={item.qty}
                    onChange={(event) => updateItem(index, 'qty', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-28 rounded-lg bg-zinc-950 px-3 py-2"
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitCost}
                    onChange={(event) => updateItem(index, 'unitCost', event.target.value)}
                  />
                </td>
                <td className="px-4 py-2 font-medium text-zinc-100">
                  {formatCurrency(item.qty * item.unitCost)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button className="text-red-400 hover:text-red-300" onClick={() => removeItem(index)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-700 bg-zinc-900">
            <tr>
              <td className="px-4 py-3 font-medium" colSpan={4}>
                Preço final com margem de {marginPercent}%
              </td>
              <td className="px-4 py-3 text-lg font-bold text-emerald-300">{formatCurrency(finalPrice)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>
    </AppShell>
  );
}
