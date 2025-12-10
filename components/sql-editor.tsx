'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { vscodeDarkInit } from '@uiw/codemirror-theme-vscode';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { bracketMatching } from '@codemirror/language';
import { Button } from '@/components/ui/button';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  disabled?: boolean;
}

export function SQLEditor({
  value,
  onChange,
  onExecute,
  disabled = false,
}: SQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onExecuteRef = useRef(onExecute);
  const disabledRef = useRef(disabled);

  // Keep refs up to date
  useEffect(() => {
    onExecuteRef.current = onExecute;
    disabledRef.current = disabled;
  }, [onExecute, disabled]);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              if (!disabledRef.current) {
                onExecuteRef.current();
              }
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...closeBracketsKeymap,
        ]),
        history(),
        closeBrackets(),
        bracketMatching(),
        autocompletion(),
        sql({ dialect: PostgreSQL }),
        lineNumbers(),
        vscodeDarkInit({
          settings: {
            fontFamily: 'ui-monospace, monospace',
          },
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, monospace',
          },
          '.cm-content': {
            padding: '12px 0',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
          },
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={editorRef}
        className="min-h-0 flex-1 overflow-hidden rounded-md border border-zinc-800 bg-[#1e1e1e]"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">Cmd</kbd> +{' '}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5">Enter</kbd> to run
        </span>
        <Button
          onClick={onExecute}
          disabled={disabled}
          className="bg-[#0e639c] text-white hover:bg-[#1177bb] disabled:opacity-50"
        >
          {disabled ? 'Running...' : 'Run Query'}
        </Button>
      </div>
    </div>
  );
}
