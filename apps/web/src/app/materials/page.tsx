'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

type Material = {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  thicknessMm: number;
  color: string;
  pricePerSheet: number;
};

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const query = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/materials', {
        method: 'POST',
        body: JSON.stringify({
          name,
          manufacturer,
          category: 'Madeirado',
          thicknessMm: 18,
          color: 'Branco',
          grainDirection: 'Vertical',
          weightKgM2: 12,
          pricePerSheet: 320,
        }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
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
      <form className="mb-6 flex gap-3" onSubmit={onSubmit}>
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Material" required />
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Fabricante" required />
        <button className="rounded-lg bg-emerald-500 px-6 font-semibold text-zinc-950">Adicionar</button>
      </form>
      <ul className="space-y-2">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {item.name} • {item.manufacturer} • {item.category} • {item.thicknessMm}mm • R$ {item.pricePerSheet}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
