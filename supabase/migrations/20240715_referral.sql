alter table auth.users
  add column ref_code text generated always as (substr(encode(id::text::bytea,'hex'),1,8)) stored,
  add column referred_by text;

create unique index on auth.users(ref_code);

-- simple view: how many рефералов
create or replace view public.ref_stats as
select u.id, count(r.*) as refs
from auth.users u
left join auth.users r on r.referred_by = u.ref_code
group by u.id;
