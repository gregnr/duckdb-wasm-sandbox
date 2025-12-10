# DuckDB-WASM Iceberg Sandbox

Experimental repo for querying Iceberg tables on S3 directly from the browser using [duckdb-wasm](https://github.com/duckdb/duckdb-wasm). Specifically designed to work with Supabase Analytic Buckets.

<img width="4608" height="2592" alt="image" src="https://github.com/user-attachments/assets/c486efe7-ecfe-4d4f-8f1f-dd01992374d1" />

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your credentials. For Supabase these can be found under the [Analytics Bucket](https://supabase.com/dashboard/project/_/storage/analytics) settings.
2. Install dependencies:
   ```bash
   pnpm i
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)
