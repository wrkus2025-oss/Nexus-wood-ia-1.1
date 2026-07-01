'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useCustomers } from '@/lib/hooks';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

export default function CustomersPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const customersQuery = useCustomers(token);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street1, setStreet1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [postalCode, setPostalCode] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          companyName,
          email,
          phone,
          contacts: email || phone ? [{ name, email, phone, role: 'Principal' }] : [],
          addresses: street1 ? [{ label: 'Principal', street1, city, state, postalCode, country: 'BR' }] : [],
        }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setStreet1('');
      setCity('');
      setState('SP');
      setPostalCode('');
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Clientes</h1>
      <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-4">
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Empresa" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 md:col-span-2" value={street1} onChange={(e) => setStreet1(e.target.value)} placeholder="Endereço principal" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="CEP" />
        <button className="rounded-lg bg-emerald-500 p-3 font-semibold text-zinc-950 md:col-span-4" type="submit">Cadastrar cliente</button>
      </form>

      <div className="space-y-3">
        {customersQuery.data?.map((customer) => (
          <article key={customer.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{customer.name}</h2>
                <p className="text-sm text-zinc-400">{customer.companyName || 'Pessoa física'} · {customer.email || 'sem email'} · {customer.phone || 'sem telefone'}</p>
              </div>
              <span className="text-sm text-zinc-400">{customer._count?.projects ?? 0} projetos</span>
            </div>
            {customer.addresses[0] ? (
              <p className="mt-3 text-sm text-zinc-500">{customer.addresses[0].street1}, {customer.addresses[0].city} - {customer.addresses[0].state}</p>
            ) : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
