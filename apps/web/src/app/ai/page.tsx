'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { FormEvent, useState } from 'react';

export default function AiPage() {
  const token = useAuthStore((s) => s.token);
  const [prompt, setPrompt] = useState('Crie uma cozinha em L de 4m por 3m com torre quente e ilha central.');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch<{ response: string }>(
        '/ai/assist',
        {
          method: 'POST',
          body: JSON.stringify({ prompt }),
        },
        token ?? undefined,
      );
      setAnswer(response.response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">IA Nexus Master</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <textarea
          className="h-40 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950" disabled={loading}>
          {loading ? 'Gerando...' : 'Executar'}
        </button>
      </form>
      {answer && <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-5">{answer}</pre>}
    </AppShell>
  );
}
