'use client';

import { DuckDBProvider } from '@/lib/duckdb-context';
import { QueryConsole } from '@/components/query-console';

export default function Home() {
  return (
    <DuckDBProvider>
      <div className="flex h-screen flex-col bg-[#1e1e1e]">
        <header className="flex items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-zinc-100">
              DuckDB SQL Console
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded bg-[#3c3c3c] px-2 py-1 font-mono text-xs text-[#cccccc]">
              duckdb-wasm
            </span>
            <span className="text-[#808080]">+</span>
            <span className="rounded bg-[#3c3c3c] px-2 py-1 font-mono text-xs text-[#cccccc]">
              iceberg
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1">
          <QueryConsole />
        </main>
      </div>
    </DuckDBProvider>
  );
}
