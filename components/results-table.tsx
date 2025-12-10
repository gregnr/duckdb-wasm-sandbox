'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { QueryResult } from '@/lib/duckdb-context';

interface ResultsTableProps {
  result: QueryResult | null;
  error: string | null;
  isLoading: boolean;
}

export function ResultsTable({ result, error, isLoading }: ResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!result?.columns) return [];

    return result.columns.map((col) => ({
      accessorKey: col,
      header: col,
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null) {
          return <span className="text-zinc-500 italic">NULL</span>;
        }
        if (typeof value === 'object') {
          return (
            <span className="font-mono text-xs">
              {JSON.stringify(value)}
            </span>
          );
        }
        return String(value);
      },
    }));
  }, [result?.columns]);

  const data = useMemo(() => result?.rows ?? [], [result?.rows]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          <span className="text-sm text-zinc-500">Executing query...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-xl rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <h3 className="mb-2 font-medium text-red-400">Query Error</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm text-red-300">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">
          Run a query to see results
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm text-zinc-500">
          {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} in{' '}
          {result.executionTime.toFixed(2)}ms
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-zinc-500">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-[#3c3c3c] bg-[#1e1e1e]">
        <Table>
          <TableHeader className="sticky top-0 bg-[#252526]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[#3c3c3c]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none whitespace-nowrap px-4 py-2 font-medium text-[#cccccc] hover:bg-[#2a2d2e]"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500"
                >
                  No results
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-[#3c3c3c] hover:bg-[#2a2d2e]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-2 font-mono text-sm text-[#d4d4d4]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
