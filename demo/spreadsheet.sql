select 'shell' as component, 'spreadsheet' as title, 'fluid' as layout;

select 'title' as component, 'Here is my spreadsheet' as contents;

select 'spreadsheet' as component,
  'spreadsheet_update.sql' as update_link,
  'My TODO Spreadsheet' as sheet_name,
  100 as column_width,
  50 as row_height,
  1 as freeze_y,
  false as show_grid;

select 
  row_number() over (order by created_at) as x,
  0 as y,
  id as value,
  '#80cbc4' as color -- light teal
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
select 
  n+5 as y ,
  4 as x, 
  n as value, 
  true as bold, 
  true as italic, 
  true as center, 
  'pink-lt' as color, 
  '### ##0.00 €' as number_format
from n
limit 100;

-- Add a new demo cell with the updated properties
select 
  0 as x,
  5 as y,
  'Wrapped Style' as value,
  true as bold,
  true as italic,
  'Arial' as font_family,
  14 as font_size,
  true as underline,
  false as strikethrough,
  'red' as text_color,
  'yellow' as color,
  true as text_align_center,
  true as vertical_align_middle,
  true as wrap_strategy_wrap,
  true as text_direction_rtl;