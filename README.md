# Spreadsheet component

> [!WARNING]
> **Important legal notice** This component is not distributed under the same permissive MIT license as the rest of SQLpage, but rather under the [GNU AGPL v3 license](./LICENSE).
> This means that you can either:
> - use the component in a project that is itself open source under the AGPL license, for free, or
> - use it in a commercial, closed source, setting by **buying a 600€ yearly license** for the component from us: contact@datapage.app

The spreadsheet component generates an online editable spreadsheet similar to Google Sheets or Excel, the contents of which are loaded from the results of your SQL query.  
It has the ability to edit cell data by posting their contents to another SQLpage.

## Screenshot

![screenshot](docs/screenshot.png)
## Documentation
### Top-level properties

- **update\_link**:  the name of another sql file, to which cell contents will be posted on update. The sql file will receive the variables:
  - `:x` and `:y` (position of the cell that was updated),
  - `:value` (the new textual contents of the cell), and
  - `:id` if an id was assigned to the cell from the row-level properties.
- **freeze\_x**: the number of columns to freeze on the left side
- **freeze\_y**: the number of rows to freeze on the top side
- **sheet\_name**: the name of the worksheet (displayed in the bottom left corner, as the tab name)
- **column\_width**: the default width of the columns (in px)
- **row\_height**: the default height of the rows (in px)
- **show\_grid**: if the gridlines are shown (default: `true`)

### Row-Level properties

- **x** the value of the x-axis (horizontal cell number)
- **y** the value of the y-axis (vertical cell number)
- **value** the value of the cell
- **bold** If present, the cell text is bold
- **italic** If present, the cell text is italic
- **color** cell background color. Can be a [SQLPage color name](https://sql.datapage.app/colors.sql) or a hexadecimal color code like `#80cbc4`.
- **text_align_center** If present, the cell text is centered
- **text_align_right** If present, the cell text is right-aligned
- **text_align_justified** If present, the cell text is justified
- **text_align_distributed** If present, the cell text is distributed
- **number_format** format the number according to the specified number format. Uses [excel number format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68).
- **id** If present, the cell has this unique identifier that will be passed to the update_link sql file.
- **font_family** The font family for the cell text
- **font_size** The font size for the cell text (in points)
- **underline** If present, the cell text is underlined
- **strikethrough** If present, the cell text has a strikethrough
- **text_color** The color of the cell text. Can be a [SQLPage color name](https://sql.datapage.app/colors.sql) or a hexadecimal color code.
- **vertical_align_top** If present, the cell content is aligned to the top
- **vertical_align_middle** If present, the cell content is aligned to the middle
- **vertical_align_bottom** If present, the cell content is aligned to the bottom
- **wrap_strategy_overflow** If present, text overflows to the next cell if empty
- **wrap_strategy_clip** If present, text is clipped if it exceeds cell width
- **wrap_strategy_wrap** If present, text wraps within the cell
- **text_direction_rtl** If present, text direction is right-to-left

### Example

#### `index.sql`
```sql
select 'spreadsheet' as component,
  'spreadsheet_update.sql' as update_link;

select 
  row_number() over (order by created_at) as x, -- x-axis: chronological order
  1 as y, -- y-axis: second row
  todo_item as value, -- cell content: todo item
  todo_id as id -- cell id (used for update link)
  '#80cbc4' as color -- light teal
from todos
order by created_at;
```
#### `spreadsheet_update.sql`

```sql
update todos set todo_item = :value where id = :id;
```

See the [full example](./demo/spreadsheet.sql) in the demo folder.
