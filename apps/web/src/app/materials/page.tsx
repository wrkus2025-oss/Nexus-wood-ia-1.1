'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useMaterialCategories, useMaterials } from '@/lib/hooks';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

export default function MaterialsPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const query = useMaterials(token);
  const categoriesQuery = useMaterialCategories(token);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [categoryName, setCategoryName] = useState('MDF');

  const createMutation = useMutation({
    mutationFn: () => apiFetch('/materials', {
      method: 'POST',
      body: JSON.stringify({
        name,
        manufacturer,
        categoryName,
        group: 'Painel',
        thicknessMm: 18,
        color: 'Branco',
        grainDirection: 'Vertical',
        weightKgM2: 12,
        pricePerSheet: 320,
      }),
    }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      queryClient.invalidateQueries({ queryKey: queryKeys.materialCategories });
      setName('');
      setManufacturer('');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Biblioteca de Materiais</h1>
      <form className="mb-6 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Material" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Fabricante" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Categoria" required />
        <button className="rounded-lg bg-emerald-500 px-6 font-semibold text-zinc-950">Adicionar</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-400">{categoriesQuery.data?.map((category) => <span key={category.id} className="rounded-full border border-zinc-700 px-3 py-1">{category.name}</span>)}</div>
      <ul className="space-y-2">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {item.name} • {item.manufacturer} • {item.category?.name ?? 'Sem categoria'} • {item.thicknessMm}mm • R$ {item.pricePerSheet}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
