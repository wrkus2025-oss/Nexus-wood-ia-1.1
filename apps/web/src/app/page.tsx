'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type AuthResponse = { accessToken: string };

export default function Home() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const path = registerMode ? '/auth/register' : '/auth/login';
      const payload = registerMode
        ? { name, email, password, workspaceName }
        : { email, password };
      const data = await apiFetch<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setToken(data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-2xl font-semibold">Nexus Wood AI 2.0</h1>
        <p className="text-sm text-zinc-400">Autentique-se e carregue seu workspace ativo.</p>

        {registerMode && (
          <>
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
              placeholder="Nome do workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          </>
        )}

        <input
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3"
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button className="w-full rounded-lg bg-emerald-500 p-3 font-semibold text-zinc-950" type="submit">
          {registerMode ? 'Criar conta e workspace' : 'Entrar'}
        </button>

        <button
          className="w-full rounded-lg border border-zinc-700 p-3 text-sm"
          type="button"
          onClick={() => setRegisterMode((value) => !value)}
        >
          {registerMode ? 'Já tenho conta' : 'Criar nova conta'}
        </button>
      </motion.form>
    </main>
  );
}
