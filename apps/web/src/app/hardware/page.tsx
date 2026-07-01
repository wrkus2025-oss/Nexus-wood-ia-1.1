'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

type Hardware = {
  id: string;
  type: string;
  name: string;
  manufacturer: string;
  code: string;
};

export default function HardwarePage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const query = useQuery({
    queryKey: ['hardware'],
    queryFn: () => apiFetch<Hardware[]>('/hardware', {}, token ?? undefined),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/hardware', {
        method: 'POST',
        body: JSON.stringify({
          type: 'Dobradiça',
          name,
          manufacturer,
          code: `HW-${Date.now()}`,
          measures: '35mm',
          unitCost: 8.5,
        }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
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
      <form className="mb-6 flex gap-3" onSubmit={onSubmit}>
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ferragem" required />
        <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Fabricante" required />
        <button className="rounded-lg bg-emerald-500 px-6 font-semibold text-zinc-950">Adicionar</button>
      </form>
      <ul className="space-y-2">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {item.type} • {item.name} • {item.manufacturer} • {item.code}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
