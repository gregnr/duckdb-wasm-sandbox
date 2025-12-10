'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type * as duckdb from '@duckdb/duckdb-wasm';
import { createDb } from './duckdb';

const S3_ENDPOINT = process.env.NEXT_PUBLIC_S3_ENDPOINT ?? '';
const S3_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID ?? '';
const S3_SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY ?? '';
const S3_REGION = process.env.NEXT_PUBLIC_S3_REGION ?? '';
const ICEBERG_TOKEN = process.env.NEXT_PUBLIC_ICEBERG_TOKEN ?? '';
const ICEBERG_CATALOG_ENDPOINT =
  process.env.NEXT_PUBLIC_ICEBERG_CATALOG_ENDPOINT ?? '';
const ICEBERG_BUCKET = process.env.NEXT_PUBLIC_ICEBERG_BUCKET ?? '';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface DuckDBContextValue {
  db: duckdb.AsyncDuckDB | null;
  connection: duckdb.AsyncDuckDBConnection | null;
  isInitializing: boolean;
  isReady: boolean;
  error: Error | null;
  executeQuery: (sql: string) => Promise<QueryResult>;
}

const DuckDBContext = createContext<DuckDBContextValue | null>(null);

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [connection, setConnection] =
    useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const database = await createDb();
        if (!mounted) return;

        const conn = await database.connect();
        if (!mounted) return;

        // Configure S3 and Iceberg
        await conn.query(`
          SET s3_endpoint='${S3_ENDPOINT}';
          SET s3_access_key_id='${S3_ACCESS_KEY_ID}';
          SET s3_secret_access_key='${S3_SECRET_ACCESS_KEY}';
          SET s3_region='${S3_REGION}';

          CREATE SECRET iceberg_secret (
            TYPE iceberg,
            TOKEN '${ICEBERG_TOKEN}'
          );
          ATTACH '${ICEBERG_BUCKET}' AS iceberg_catalog (
            TYPE iceberg,
            SECRET iceberg_secret,
            ENDPOINT '${ICEBERG_CATALOG_ENDPOINT}'
          );
        `);

        if (!mounted) return;

        setDb(database);
        setConnection(conn);
        setIsInitializing(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsInitializing(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const executeQuery = useCallback(
    async (sql: string): Promise<QueryResult> => {
      if (!connection) {
        throw new Error('Database connection not ready');
      }

      const startTime = performance.now();
      const result = await connection.query(sql);
      const executionTime = performance.now() - startTime;

      const columns = result.schema.fields.map((field) => field.name);
      const rows = result.toArray().map((row) => row.toJSON());

      return {
        columns,
        rows,
        rowCount: rows.length,
        executionTime,
      };
    },
    [connection]
  );

  const value: DuckDBContextValue = {
    db,
    connection,
    isInitializing,
    isReady: !isInitializing && !error && !!connection,
    error,
    executeQuery,
  };

  return (
    <DuckDBContext.Provider value={value}>{children}</DuckDBContext.Provider>
  );
}

export function useDuckDB() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error('useDuckDB must be used within a DuckDBProvider');
  }
  return context;
}
