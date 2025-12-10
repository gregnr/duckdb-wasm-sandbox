'use client';

import { useState, useCallback } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { SQLEditor } from './sql-editor';
import { ResultsTable } from './results-table';
import { useDuckDB, type QueryResult } from '@/lib/duckdb-context';

const DEFAULT_QUERY = `-- Query your Iceberg tables
SELECT * FROM iceberg_catalog.analytics.events
LIMIT 100;`;

export function QueryConsole() {
  const { isReady, isInitializing, error: dbError, executeQuery } = useDuckDB();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = useCallback(async () => {
    if (!isReady || isExecuting) return;

    setIsExecuting(true);
    setQueryError(null);

    try {
      const res = await executeQuery(query);
      setResult(res);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  }, [isReady, isExecuting, query, executeQuery]);

  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-zinc-300">
              Initializing DuckDB
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Loading WASM and connecting to Iceberg catalog...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-xl rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <h2 className="mb-2 text-lg font-medium text-red-400">
            Failed to Initialize Database
          </h2>
          <pre className="whitespace-pre-wrap font-mono text-sm text-red-300">
            {dbError.message}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel defaultSize={40} minSize={20}>
        <div className="h-full p-4">
          <SQLEditor
            value={query}
            onChange={setQuery}
            onExecute={handleExecute}
            disabled={isExecuting}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full p-4">
          <ResultsTable
            result={result}
            error={queryError}
            isLoading={isExecuting}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
