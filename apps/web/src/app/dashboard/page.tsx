'use client';

import { AppShell } from '@/components/app-shell';
import { motion } from 'framer-motion';

const cards = [
  { title: 'Projetos em Andamento', value: '0' },
  { title: 'Projetos Concluídos', value: '0' },
  { title: 'Faturamento', value: 'R$ 0,00' },
  { title: 'Produção', value: '0%' },
  { title: 'Custos', value: 'R$ 0,00' },
  { title: 'Aproveitamento Material', value: '0%' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard Profissional</h1>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
          >
            <p className="text-sm text-zinc-400">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </motion.article>
        ))}
      </section>
    </AppShell>
  );
}
