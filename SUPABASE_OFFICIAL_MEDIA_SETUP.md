# OFFICIAL_MEDIA: Supabase setup

## 1) Create project and collect keys
- Open Supabase dashboard.
- Copy:
  - Project URL (Settings -> API -> Project URL)
  - `anon` public key (Settings -> API -> Project API keys)

Put values into `crimson-config.js`:

```js
const CRIMSON_SUPABASE = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY',
  bucket: 'official-media',
  table: 'official_media_posts'
};
```

## 2) Create storage bucket
- Storage -> New bucket -> name: `official-media`
- Make it **Public**.

## 3) Create SQL table
Run SQL in Supabase SQL Editor:

```sql
create table if not exists public.official_media_posts (
  id text primary key,
  type text not null,
  mime text not null,
  caption text default '',
  t bigint not null,
  media_url text not null,
  storage_path text not null,
  owner text default 'owner'
);
```

## 4) RLS policies (minimal open read/write)
For quick launch (client-side uploads), run:

```sql
alter table public.official_media_posts enable row level security;

create policy "media read for all"
on public.official_media_posts
for select
to anon
using (true);

create policy "media insert for all"
on public.official_media_posts
for insert
to anon
with check (true);

create policy "media delete for all"
on public.official_media_posts
for delete
to anon
using (true);
```

For Storage bucket policies:
- allow `anon` to upload/read/delete in `official-media`.

## 5) Security note
- Current setup is intentionally simple for fast launch.
- For production, replace public insert/delete with a server-side API and stricter policies.

