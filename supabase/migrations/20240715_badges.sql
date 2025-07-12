create table public.badges (
  id      smallint primary key,
  code    text unique,
  title   text,
  icon    text
);

create table public.user_badges (
  user_id uuid references auth.users on delete cascade,
  badge_id smallint references badges(id),
  given_at timestamptz default now(),
  primary key(user_id, badge_id)
);

insert into badges(id, code, title, icon) values
  (1, 'streak5', 'Стрик 5', '🔥'),
  (2, 'speedy',  'Скоростной', '⚡');
