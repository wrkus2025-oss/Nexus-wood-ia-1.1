'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Material = { id: string; name: string; thicknessMm: number; pricePerSheet: number };
type Hardware = { id: string; name: string; type: string; unitCost: number };

type BudgetItem = {
  description: string;
  category: 'material' | 'hardware' | 'service' | 'other';
  qty: number;
  unitCost: number;
};

const INITIAL_ITEMS: BudgetItem[] = [
  { description: 'MDF Branco 18mm — chapa', category: 'material', qty: 8, unitCost: 320 },
  { description: 'MDF 6mm fundo — chapa', category: 'material', qty: 2, unitCost: 150 },
  { description: 'Dobradiça Blum soft-close', category: 'hardware', qty: 12, unitCost: 28.5 },
  { description: 'Corrediça telescópica 400mm', category: 'hardware', qty: 4, unitCost: 65 },
  { description: 'Puxador tubular inox', category: 'hardware', qty: 8, unitCost: 18.9 },
  { description: 'Mão de obra montagem', category: 'service', qty: 1, unitCost: 800 },
  { description: 'Transporte e instalação', category: 'service', qty: 1, unitCost: 300 },
];

const CATEGORY_LABEL: Record<string, string> = {
  material: 'Material',
  hardware: 'Ferragem',
  service: 'Serviço',
  other: 'Outro',
};

const CATEGORY_COLOR: Record<string, string> = {
  material: 'text-blue-400',
  hardware: 'text-emerald-400',
  service: 'text-yellow-400',
  other: 'text-zinc-400',
};

export default function BudgetPage() {
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<BudgetItem[]>(INITIAL_ITEMS);
  const [margin, setMargin] = useState(30);
  const [projectName, setProjectName] = useState('Armário de Cozinha');

  useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });

  useQuery({
    queryKey: ['hardware'],
    queryFn: () => apiFetch<Hardware[]>('/hardware', {}, token ?? undefined),
    enabled: !!token,
  });

  function update(i: number, field: keyof BudgetItem, value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field]: field === 'description' || field === 'category' ? value : Number(value),
      };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: 'Novo item', category: 'other', qty: 1, unitCost: 0 },
    ]);
  }

  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const marginValue = subtotal * (margin / 100);
  const total = subtotal + marginValue;

  const byCategory = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.qty * item.unitCost;
    return acc;
  }, {});

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Orçamento</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Nome do Projeto</label>
          <input
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Margem de lucro (%)</label>
          <input
            className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
            type="number"
            min={0}
            max={200}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(byCategory).map(([cat, val]) => (
          <div key={cat} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className={`text-xs font-medium ${CATEGORY_COLOR[cat]}`}>{CATEGORY_LABEL[cat] ?? cat}</p>
            <p className="mt-1 text-lg font-semibold">
              R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium text-zinc-400">Subtotal</p>
          <p className="mt-1 text-lg font-semibold">
            R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-700 bg-emerald-900/20 p-4">
          <p className="text-xs font-medium text-emerald-400">Total com margem {margin}%</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
          <h2 className="font-medium">Itens do Orçamento — {projectName}</h2>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-zinc-950"
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
              <th className="px-4 py-2">Custo unit.</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded bg-zinc-950 px-2 py-1"
                    value={item.description}
                    onChange={(e) => update(i, 'description', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded bg-zinc-950 px-2 py-1"
                    value={item.category}
                    onChange={(e) => update(i, 'category', e.target.value)}
                  >
                    <option value="material">Material</option>
                    <option value="hardware">Ferragem</option>
                    <option value="service">Serviço</option>
                    <option value="other">Outro</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-16 rounded bg-zinc-950 px-2 py-1"
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => update(i, 'qty', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-24 rounded bg-zinc-950 px-2 py-1"
                    type="number"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) => update(i, 'unitCost', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-zinc-300">
                  R$ {(item.qty * item.unitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2">
                  <button className="text-red-400 hover:text-red-300" onClick={() => remove(i)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-700 bg-zinc-900">
            <tr>
              <td className="px-4 py-3 font-medium" colSpan={4}>
                Total com {margin}% de margem
              </td>
              <td className="px-4 py-3 font-bold text-emerald-400">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </AppShell>
  );
}
