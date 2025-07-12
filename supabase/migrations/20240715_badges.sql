create table public.badges (
  id      smallint primary key,
  code    text unique,
  title   text,
  icon    text,
  description text
);

create table public.user_badges (
  user_id uuid references auth.users on delete cascade,
  badge_id smallint references badges(id),
  given_at timestamptz default now(),
  primary key(user_id, badge_id)
);

insert into badges(id, code, title, icon, description) values
  (1, 'streak5', 'Стрик 5', '🔥', 'Решай задачи 5 дней подряд'),
  (2, 'speedy', 'Скоростной', '⚡', 'Решай задачи быстро (< 60 сек)'),
  (3, 'perfectionist', 'Перфекционист', '🎯', 'Реши 20 задач подряд без ошибок'),
  (4, 'night_owl', 'Сова', '🌙', 'Решай задачи поздно вечером (22:00-02:00)'),
  (5, 'early_bird', 'Жаворонок', '🌅', 'Решай задачи рано утром (06:00-08:00)'),
  (6, 'weekend_warrior', 'Выходной воин', '🏆', 'Активно решай задачи на выходных'),
  (7, 'topic_master', 'Мастер темы', '🎓', 'Освой одну тему на 95%'),
  (8, 'hundred_tasks', 'Сотня', '💯', 'Реши 100 задач'),
  (9, 'first_correct', 'Первый успех', '✅', 'Первая правильно решенная задача'),
  (10, 'comeback_kid', 'Возвращение', '🔄', 'Вернись к решению задач после перерыва'),
  (11, 'streak10', 'Стрик 10', '🔥🔥', 'Решай задачи 10 дней подряд'),
  (12, 'streak30', 'Стрик 30', '🔥🔥🔥', 'Решай задачи 30 дней подряд'),
  (13, 'marathon', 'Марафон', '🏃', 'Реши 50 задач за один день'),
  (14, 'accuracy_master', 'Мастер точности', '🎯', 'Достигни 95% точности по всем темам'),
  (15, 'explorer', 'Исследователь', '🗺️', 'Изучи все доступные темы');
