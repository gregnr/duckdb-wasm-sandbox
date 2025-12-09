'use client';

import { createDb } from '@/lib/duckdb';
import Image from 'next/image';
import { useEffect } from 'react';
import * as arrow from 'apache-arrow';

const S3_ENDPOINT = process.env.NEXT_PUBLIC_S3_ENDPOINT!;
const S3_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!;
const S3_SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!;
const S3_REGION = process.env.NEXT_PUBLIC_S3_REGION!;
const ICEBERG_TOKEN = process.env.NEXT_PUBLIC_ICEBERG_TOKEN!;
const ICEBERG_CATALOG_ENDPOINT =
  process.env.NEXT_PUBLIC_ICEBERG_CATALOG_ENDPOINT!;
const ICEBERG_BUCKET = process.env.NEXT_PUBLIC_ICEBERG_BUCKET!;

export default function Home() {
  useEffect(() => {
    async function run() {
      const db = await createDb();
      const connection = await db.connect();

      await connection.query(
        `
          -- duckdb-wasm requires legacy S3 settings
          SET s3_endpoint='${S3_ENDPOINT}';
          SET s3_access_key_id='${S3_ACCESS_KEY_ID}';
          SET s3_secret_access_key='${S3_SECRET_ACCESS_KEY}';
          SET s3_region='${S3_REGION}';

          -- configure and attach Iceberg catalog
          CREATE SECRET iceberg_secret (
            TYPE iceberg,
            TOKEN '${ICEBERG_TOKEN}'
          );
          ATTACH '${ICEBERG_BUCKET}' AS iceberg_catalog (
            TYPE iceberg,
            SECRET iceberg_secret,
            ENDPOINT '${ICEBERG_CATALOG_ENDPOINT}'
          );
        `
      );

      const table = await connection.query<{ greeting: arrow.Utf8 }>(
        `
          select * from iceberg_catalog.analytics.events;
        `
      );

      // get first row as an Arrow "row" proxy
      const rows = table.toArray();

      // convert that row to a plain JS object
      const objs = rows.map((row) => row.toJSON());

      console.log('duckdb result', objs);
    }
    run();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{' '}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{' '}
            or the{' '}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{' '}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
