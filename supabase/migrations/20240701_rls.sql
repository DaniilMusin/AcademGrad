-- Row Level Security
alter table attempts enable row level security;

create policy "read own"
  on attempts for select
  using (auth.uid() = user_id);

create policy "insert own"
  on attempts for insert
  with check (auth.uid() = user_id);
