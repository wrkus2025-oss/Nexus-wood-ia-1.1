'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useProject } from '@/lib/hooks';
import { buildDxfCutPlan, buildSvgCutPlan, downloadTextFile } from '@/lib/cut-export';
import { CutPiece, CutSettings, optimizeCutPlan } from '@/lib/cut-optimization';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

type Material = {
  id: string;
  name: string;
  thicknessMm: number;
  color: string;
  pricePerSheet: number;
};

const INITIAL_SETTINGS: CutSettings = {
  sheetWidthMm: 2750,
  sheetHeightMm: 1830,
  sawKerfMm: 4,
  edgeBandingMm: 1,
  wasteTargetPercent: 12,
};

const INITIAL_PIECES: CutPiece[] = [
  { label: 'Lateral', widthMm: 600, heightMm: 2300, qty: 2 },
  { label: 'Topo', widthMm: 900, heightMm: 600, qty: 1 },
  { label: 'Base', widthMm: 900, heightMm: 600, qty: 1 },
  { label: 'Prateleira', widthMm: 864, heightMm: 580, qty: 3 },
  { label: 'Porta', widthMm: 444, heightMm: 718, qty: 2 },
  { label: 'Fundo', widthMm: 900, heightMm: 2300, qty: 1 },
];

const CARD_COLORS = [
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#fb7185',
  '#2dd4bf',
  '#facc15',
];

function CutPlanPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const token = useAuthStore((state) => state.token);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [pieces, setPieces] = useState<CutPiece[]>(INITIAL_PIECES);
  const [settings, setSettings] = useState<CutSettings>(INITIAL_SETTINGS);

  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });
  const projectQuery = useProject(token, projectId);
  const generatedPieces = useMemo(() => {
    if (!projectQuery.data) {
      return [] as CutPiece[];
    }
    const parts = projectQuery.data.spaces.flatMap((space) =>
      space.units.flatMap((unit) => unit.modules.flatMap((module) => module.parts)),
    );
    return parts.map((part) => ({
      label: part.name,
      widthMm: part.widthMm,
      heightMm: part.heightMm,
      qty: part.quantity,
    }));
  }, [projectQuery.data]);
  const currentPieces = generatedPieces.length > 0 ? generatedPieces : pieces;
  const projectMaterialId =
    projectQuery.data?.spaces
      .flatMap((space) => space.units.flatMap((unit) => unit.modules.flatMap((module) => module.parts)))
      .find((part) => part.material?.id)?.material?.id ?? '';
  const effectiveSelectedMaterialId = selectedMaterialId || projectMaterialId;

  const selectedMaterial = materialsQuery.data?.find((material) => material.id === effectiveSelectedMaterialId);

  const optimization = useMemo(() => optimizeCutPlan(currentPieces, settings), [currentPieces, settings]);

  const totalMaterialCost = selectedMaterial
    ? optimization.totalSheets * selectedMaterial.pricePerSheet
    : 0;

  const wasteAlert = optimization.wastePercent > settings.wasteTargetPercent;

  function updatePiece(index: number, field: keyof CutPiece, value: string) {
    setPieces((current) =>
      current.map((piece, pieceIndex) =>
        pieceIndex === index
          ? {
              ...piece,
              [field]: field === 'label' ? value : Math.max(1, Number(value) || 1),
            }
          : piece,
      ),
    );
  }

  function updateSetting(field: keyof CutSettings, value: string) {
    setSettings((current) => ({
      ...current,
      [field]: Math.max(0, Number(value) || 0),
    }));
  }

  function addPiece() {
    setPieces((current) => [
      ...current,
      { label: `Peça ${current.length + 1}`, widthMm: 600, heightMm: 400, qty: 1 },
    ]);
  }

  function removePiece(index: number) {
    setPieces((current) => current.filter((_, pieceIndex) => pieceIndex !== index));
  }

  function handleExportSvg() {
    downloadTextFile(
      buildSvgCutPlan(optimization.layouts, settings),
      'nexus-wood-cut-plan.svg',
      'image/svg+xml;charset=utf-8',
    );
  }

  function handleExportDxf() {
    downloadTextFile(
      buildDxfCutPlan(optimization.layouts, settings),
      'nexus-wood-cut-plan.dxf',
      'application/dxf;charset=utf-8',
    );
  }

  const layoutScale = 320 / Math.max(settings.sheetWidthMm, settings.sheetHeightMm);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Plano de Corte Comercial</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Nesting automático com heurística guilhotina, layout 2D e exportação SVG/DXF.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
            disabled={optimization.layouts.length === 0}
            onClick={handleExportSvg}
          >
            Exportar SVG
          </button>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            disabled={optimization.layouts.length === 0}
            onClick={handleExportDxf}
          >
            Exportar DXF
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 font-medium">Configuração do nesting</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-zinc-400">Material MDF</span>
              <select
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                value={effectiveSelectedMaterialId}
                onChange={(event) => setSelectedMaterialId(event.target.value)}
                 disabled={generatedPieces.length > 0}
              >
                <option value="">Selecione o material</option>
                {materialsQuery.data?.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.thicknessMm}mm)
                  </option>
                ))}
              </select>
            </label>

            {[
              ['sheetWidthMm', 'Largura da chapa (mm)'],
              ['sheetHeightMm', 'Altura da chapa (mm)'],
              ['sawKerfMm', 'Serra / kerf (mm)'],
              ['edgeBandingMm', 'Fita de borda (mm)'],
              ['wasteTargetPercent', 'Meta de desperdício (%)'],
            ].map(([field, label]) => (
              <label key={field} className="text-sm">
                <span className="mb-1 block text-xs text-zinc-400">{label}</span>
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                  type="number"
                  min={0}
                  value={settings[field as keyof CutSettings]}
                  onChange={(event) => updateSetting(field as keyof CutSettings, event.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            A espessura da fita de borda é considerada como folga de acabamento em cada peça.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Total de chapas', value: String(optimization.totalSheets) },
            { label: 'Aproveitamento geral', value: `${optimization.utilizationPercent.toFixed(1)}%` },
            {
              label: 'Desperdício',
              value: `${optimization.wastePercent.toFixed(1)}%`,
              tone: wasteAlert ? 'text-amber-300' : 'text-emerald-300',
            },
            {
              label: 'Custo de material',
              value: selectedMaterial ? `R$ ${totalMaterialCost.toFixed(2)}` : 'Selecione um MDF',
            },
            {
              label: 'Área líquida das peças',
              value: `${(optimization.totalAreaMm2 / 1_000_000).toFixed(3)} m²`,
            },
            {
              label: 'Área com folgas de corte',
              value: `${(optimization.totalCutAreaMm2 / 1_000_000).toFixed(3)} m²`,
            },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-400">{card.label}</p>
              <p className={`mt-2 text-xl font-semibold ${card.tone ?? ''}`}>{card.value}</p>
            </article>
          ))}
        </section>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-zinc-800">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
          <h2 className="font-medium">Peças do projeto</h2>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            onClick={addPiece}
            disabled={generatedPieces.length > 0}
          >
            + Peça
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2">Peça</th>
              <th className="px-4 py-2">Largura</th>
              <th className="px-4 py-2">Altura</th>
              <th className="px-4 py-2">Qtd</th>
              <th className="px-4 py-2">Área</th>
              <th className="px-4 py-2 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {currentPieces.map((piece, index) => (
              <tr key={`${piece.label}-${index}`} className="border-t border-zinc-800">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded-lg bg-zinc-950 px-3 py-2"
                    value={piece.label}
                    onChange={(event) => updatePiece(index, 'label', event.target.value)}
                    disabled={generatedPieces.length > 0}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-28 rounded-lg bg-zinc-950 px-3 py-2"
                    type="number"
                    min={1}
                    value={piece.widthMm}
                    onChange={(event) => updatePiece(index, 'widthMm', event.target.value)}
                    disabled={generatedPieces.length > 0}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-28 rounded-lg bg-zinc-950 px-3 py-2"
                    type="number"
                    min={1}
                    value={piece.heightMm}
                    onChange={(event) => updatePiece(index, 'heightMm', event.target.value)}
                    disabled={generatedPieces.length > 0}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-20 rounded-lg bg-zinc-950 px-3 py-2"
                    type="number"
                    min={1}
                    value={piece.qty}
                    onChange={(event) => updatePiece(index, 'qty', event.target.value)}
                    disabled={generatedPieces.length > 0}
                  />
                </td>
                <td className="px-4 py-2 text-zinc-400">
                  {((piece.widthMm * piece.heightMm * piece.qty) / 1_000_000).toFixed(3)} m²
                </td>
                <td className="px-4 py-2 text-right">
                  <button className="text-red-400 hover:text-red-300 disabled:opacity-50" onClick={() => removePiece(index)} disabled={generatedPieces.length > 0}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Layout 2D das chapas</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Visualização comercial do nesting com identificação e dimensão de cada peça.
            </p>
          </div>
          {wasteAlert ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              Desperdício acima da meta
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              Meta de desperdício atendida
            </span>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {optimization.layouts.map((sheet) => (
            <article key={sheet.index} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Chapa {sheet.index + 1}</h3>
                  <p className="text-xs text-zinc-500">
                    Aproveitamento {sheet.utilizationPercent.toFixed(1)}% • Desperdício{' '}
                    {sheet.wastePercent.toFixed(1)}%
                  </p>
                </div>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {sheet.placements.length} peças
                </span>
              </div>

              <div
                className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                style={{
                  width: settings.sheetWidthMm * layoutScale,
                  height: settings.sheetHeightMm * layoutScale,
                  maxWidth: '100%',
                }}
              >
                {sheet.placements.map((placement, index) => {
                  const color = CARD_COLORS[index % CARD_COLORS.length];
                  const left = placement.xMm * layoutScale;
                  const top = placement.yMm * layoutScale;
                  const width = placement.widthMm * layoutScale;
                  const height = placement.heightMm * layoutScale;
                  const fontSize = Math.max(10, Math.min(14, Math.min(width, height) * 0.18));

                  return (
                    <div
                      key={placement.id}
                      className="absolute flex flex-col items-center justify-center overflow-hidden rounded-md border text-center"
                      style={{
                        left,
                        top,
                        width,
                        height,
                        background: `${color}55`,
                        borderColor: color,
                        color,
                        fontSize,
                      }}
                    >
                      <span className="px-1 font-semibold">{placement.label}</span>
                      <span className="px-1 text-[10px] text-zinc-100">
                        {placement.widthMm} × {placement.heightMm} mm
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        {optimization.unplaced.length > 0 ? (
          <p className="mt-4 text-sm text-red-300">
            Peças não alocadas: {optimization.unplaced.join(', ')}. Revise o tamanho da chapa ou as dimensões.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

export default function CutPlanPage() {
  return (
    <Suspense fallback={<AppShell><p className="text-sm text-zinc-400">Carregando plano de corte...</p></AppShell>}>
      <CutPlanPageContent />
    </Suspense>
  );
}
