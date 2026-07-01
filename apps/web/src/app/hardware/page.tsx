'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useHardware, useHardwareCategories } from '@/lib/hooks';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

export default function HardwarePage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const query = useHardware(token);
  const categoriesQuery = useHardwareCategories(token);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [categoryName, setCategoryName] = useState('Ferragens Premium');

  const createMutation = useMutation({
    mutationFn: () => apiFetch('/hardware', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Dobradiça',
        name,
        manufacturer,
        categoryName,
        code: `HW-${Date.now()}`,
        measures: '35mm',
        unitCost: 8.5,
      }),
    }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hardware });
      queryClient.invalidateQueries({ queryKey: queryKeys.hardwareCategories });
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
      <h1 className="mb-6 text-2xl font-semibold">Biblioteca de Ferragens</h1>
      <form className="mb-6 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ferragem" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Fabricante" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Categoria" required />
        <button className="rounded-lg bg-emerald-500 px-6 font-semibold text-zinc-950">Adicionar</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-400">{categoriesQuery.data?.map((category) => <span key={category.id} className="rounded-full border border-zinc-700 px-3 py-1">{category.name}</span>)}</div>
      <ul className="space-y-2">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {item.type} • {item.name} • {item.manufacturer} • {item.category?.name ?? 'Sem categoria'} • {item.code}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
