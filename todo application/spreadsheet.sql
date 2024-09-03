select 'shell' as component, 'spreadsheet' as title, 'fluid' as layout;

select 'title' as component, 'Here is my spreadsheet' as contents;

select 'spreadsheet' as component, 'spreadsheet_update.sql' as update_link;

select 
  row_number() over (order by created_at) as x,
  0 as y,
  id as value
from todos
order by created_at;

select 
  row_number() over (order by created_at) as x,
  1 as y,
  title as value,
  id
from todos
order by created_at;

with recursive n(n) as (
    select 0
    union all
    select n + 1 from n
  )
select n+5 as y , 4 as x, n as value, true as bold, true as italic, true as center, 'cyan' as color, '### ##0.00 €' as number_format
from n
limit 10*1000;