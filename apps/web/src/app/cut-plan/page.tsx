'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Material = {
  id: string;
  name: string;
  thicknessMm: number;
  color: string;
  pricePerSheet: number;
};

type CutPiece = {
  label: string;
  widthMm: number;
  heightMm: number;
  qty: number;
};

const SHEET_W = 2750;
const SHEET_H = 1830;
const SAW_KERF = 4;

function calcSheets(pieces: CutPiece[]): { sheets: number; waste: number; totalArea: number } {
  let usedArea = 0;
  for (const p of pieces) {
    usedArea += p.widthMm * p.heightMm * p.qty;
  }
  const sheetArea = SHEET_W * SHEET_H;
  const sheets = Math.ceil(usedArea / (sheetArea * 0.85));
  const waste = Math.max(0, 100 - Math.round((usedArea / (sheets * sheetArea)) * 100));
  return { sheets, waste, totalArea: usedArea };
}

const DEMO_PIECES: CutPiece[] = [
  { label: 'Lateral', widthMm: 600, heightMm: 2300, qty: 2 },
  { label: 'Topo', widthMm: 900, heightMm: 600, qty: 1 },
  { label: 'Base', widthMm: 900, heightMm: 600, qty: 1 },
  { label: 'Prateleira', widthMm: 864, heightMm: 580, qty: 3 },
  { label: 'Porta', widthMm: 444, heightMm: 718, qty: 2 },
  { label: 'Fundo', widthMm: 900, heightMm: 2300, qty: 1 },
];

export default function CutPlanPage() {
  const token = useAuthStore((s) => s.token);
  const [selectedMat, setSelectedMat] = useState('');
  const [pieces, setPieces] = useState<CutPiece[]>(DEMO_PIECES);

  const materialsQ = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });

  const selectedMaterial = materialsQ.data?.find((m) => m.id === selectedMat);
  const { sheets, waste, totalArea } = calcSheets(pieces);
  const totalCost = selectedMaterial ? (sheets * selectedMaterial.pricePerSheet).toFixed(2) : '—';

  function updatePiece(i: number, field: keyof CutPiece, value: string) {
    setPieces((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field]: field === 'label' ? value : Number(value),
      };
      return next;
    });
  }

  function addPiece() {
    setPieces((prev) => [...prev, { label: 'Nova peça', widthMm: 600, heightMm: 400, qty: 1 }]);
  }

  function removePiece(i: number) {
    setPieces((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Simple visual representation: scale pieces to fit canvas
  const CANVAS_W = 550;
  const CANVAS_H = Math.round((CANVAS_W / SHEET_W) * SHEET_H);
  const scale = CANVAS_W / SHEET_W;

  // Greedy left-to-right row packer for visual
  type Rect = { x: number; y: number; w: number; h: number; label: string };
  const rects: Rect[] = [];
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      const pw = p.widthMm + SAW_KERF;
      const ph = p.heightMm + SAW_KERF;
      if (cx + pw > SHEET_W) {
        cx = 0;
        cy += rowH;
        rowH = 0;
      }
      if (cy + ph > SHEET_H) break;
      rects.push({ x: cx, y: cy, w: p.widthMm, h: p.heightMm, label: p.label });
      cx += pw;
      rowH = Math.max(rowH, ph);
    }
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Plano de Corte</h1>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 font-medium">Configuração</h2>
          <label className="mb-1 block text-xs text-zinc-400">Material (Chapa)</label>
          <select
            className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"
            value={selectedMat}
            onChange={(e) => setSelectedMat(e.target.value)}
          >
            <option value="">— Selecione um material —</option>
            {materialsQ.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.thicknessMm}mm) — R$ {m.pricePerSheet}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Chapa padrão: {SHEET_W} × {SHEET_H} mm | Serra: {SAW_KERF} mm
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Chapas necessárias', value: String(sheets) },
            { label: 'Desperdício estimado', value: `${waste}%` },
            { label: 'Área total das peças', value: `${(totalArea / 1_000_000).toFixed(3)} m²` },
            { label: 'Custo total material', value: `R$ ${totalCost}` },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-400">{c.label}</p>
              <p className="mt-1 text-xl font-semibold">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
          <h2 className="font-medium">Lista de Peças</h2>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-zinc-950"
            onClick={addPiece}
          >
            + Peça
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2">Peça</th>
              <th className="px-4 py-2">Larg (mm)</th>
              <th className="px-4 py-2">Alt (mm)</th>
              <th className="px-4 py-2">Qtd</th>
              <th className="px-4 py-2">Área</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((p, i) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded bg-zinc-950 px-2 py-1"
                    value={p.label}
                    onChange={(e) => updatePiece(i, 'label', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-20 rounded bg-zinc-950 px-2 py-1"
                    type="number"
                    value={p.widthMm}
                    onChange={(e) => updatePiece(i, 'widthMm', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-20 rounded bg-zinc-950 px-2 py-1"
                    type="number"
                    value={p.heightMm}
                    onChange={(e) => updatePiece(i, 'heightMm', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-16 rounded bg-zinc-950 px-2 py-1"
                    type="number"
                    min={1}
                    value={p.qty}
                    onChange={(e) => updatePiece(i, 'qty', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-zinc-400">
                  {((p.widthMm * p.heightMm * p.qty) / 1_000_000).toFixed(3)} m²
                </td>
                <td className="px-4 py-2">
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => removePiece(i)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="mb-3 font-medium">Visualização — Chapa 1 de {sheets}</h2>
        <div
          className="relative overflow-hidden rounded-lg border border-zinc-700"
          style={{ width: CANVAS_W, height: CANVAS_H, background: '#1a1a1a' }}
        >
          {rects.map((r, i) => {
            const uniqueColors = [...new Set(pieces.map((p) => p.label))];
            const ci = uniqueColors.indexOf(r.label) % colors.length;
            return (
              <div
                key={i}
                className="absolute flex items-center justify-center overflow-hidden rounded-sm border border-zinc-900 text-center"
                style={{
                  left: r.x * scale,
                  top: r.y * scale,
                  width: r.w * scale,
                  height: r.h * scale,
                  background: colors[ci] + '55',
                  borderColor: colors[ci],
                  fontSize: Math.min(r.w, r.h) * scale * 0.15,
                  color: colors[ci],
                  lineHeight: 1.2,
                }}
              >
                <span className="px-0.5">{r.label}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Disposição automática para visualização. Otimização real recomenda software de nesting dedicado.
        </p>
      </div>
    </AppShell>
  );
}
