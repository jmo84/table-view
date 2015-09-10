
# table-view.js

An automatic table updater written in standard JavaScript. Designed to be a compact solution for mobile devices. In its compressed form, the script is only 10 kilobytes.

With search engine visibility in mind, the table can be initialized from its body's HTML. There's also an option for initializing it using a data variable; you may use an `Array` or `Object` as a data source. There's column sorting and styling, cell customization, pivot tables, paging, and automatic updating.

It listens to notifications from `Object.observe` (if supported) and updates a table's contents.
When passing an `Object` as data, it will render as a two column pivot table. With an `Array`, each element will correspond to one row in the table. The `columns` option defines how each `Array` element is used when rendering table cells.

There are no dependencies, but if you want `Object.observe` to work in non-compliant browsers, load the `Object.observe` polyfill before loading the TableView script. The sorting code checks to see if `classList` is supported for styling sorted column headers. A polyfill for `classList` is available for browsers that don't support it.

## Usage

Load `table-view.js` or `table-view.min.js` with your page. The script defines the function `TableView` which is meant to be called like a class. The constructor takes an object with various properties to define its behavior.

```javascript
var view = new TableView({
  table: 'people_table',
  data: [
    /* You'll probably use a variable for data, but here is an example data array */    
		{ name: "Jesse", age: 44, gender: "M"},
		{ name: "Sally", age: 67, gender: "F"},
		{ name: "Bobby", age: 6, gender: "M"},
		{ name: "Tracy", age: 4, gender: "F"}
  ],
  columns: ['name','age','gender']
});

// Manually call "update" because the data hasn't changed yet.
view.update();

```
The following is an example of HTML markup for a `TableView` table. **Important:** You must define a `<tbody>` for the table, but `<colgroup>` and `<thead>` are optional.

```html
<table id="people_table">
    <colgroup>
        <col width="200" id="columnPersonName" />
        <col width="50" id="columnPersonAge" />
        <col width="50" id="columnPersonGender" />
    </colgroup>
    <thead>
        <tr>
            <td>Name</td>
            <td>Age</td>
            <td>Gender</td>
        </tr>
    </thead>
    <tbody>
    </tbody>
</table>

```

## Options

Options should be passed to the constructor as one object with any of the following properties:

| Name         | Default         | Description                                        |
| -------------|-----------------|----------------------------------------------------|
| table       | **Required**       | A string ID of a table or an instance of `HTMLTableElement` |
| columns       | **Required**       | `Array` of strings naming which properties to use in the table. Not required if `data` is not an `Array`.     |and instead pass an `Object`, the table will be a key/value pivot table.             |
| data      | _Optional_             | To use the table's content as defined in the HTML, do not set this option. Otherwise, pass an `Array` of objects to use as row data, or an `Object` to create a pivot table. You can also pass a `String` table ID to copy another table's content. |
| onChange      | _Optional_             | A `Function` that is called after the data changes. Not called after sorting.                    |
| onUpdate      | _Optional_             | A `Function` that is called after the table changes. Called after sorting.                    |
| onSort     | _Optional_             | A `Function` that is called after the table is sorted.
| onProcess     | _Optional_             | A `Function` that is called once data changes. Return `false` to stop update. Argument passed: `Array` of changes from `Object.observe`|
| onCheckChange    | _Optional_             | A `Function` that is called on checkbox changes. Arguments passed: checked, checkIndex|
| columnAttributes      | _Optional_             | A dictionary of column names tied to objects that contain all of that column's cell attributes. See example below.                     |
| rowAttributes      | _Optional_             | An object that contains all of the table rows' attributes. If a pivot table, you specify property names here. See example for pivot table.
| exclude      | _Optional_             | `Array` of strings that are properties/columns to ignore in pivot table mode.                    |
| formatter      | formatCellHtml             | A `Function` that returns a string with a cell's HTML markup. Arguments passed: cell, column, row, index                    |
| compareItems      | defaultSort             | A `Function` that overrides the sorting function. Arguments passed: object1, object2 |
| sortColumn       | _optional_       | Column name that is sorted. |
| sortClass       | `"sorted"`       | A CSS class name for a column that is sorted in any way. |
| sortClassAscending       | `"sorted-asc"`       | A CSS class name for a column that is sorted in ascending order. |
| sortClassDescending       | `"sorted-desc"`       | A CSS class name for a column that is sorted in descending order. |
| triggers       | _optional_       | An `Array` of objects that will cause the table to be updated once changed. |
| isReversed      | `false`             | Whether the table's order is reversed. Changed upon sorting. 
| isRecursive       | `true`       | Whether the data is watched at all levels, instead of just the first level |
| body | `0` (first)| Optional. For tables with multiple bodies, the index of the body to update. A table body instance (`HTMLTableSectionElement`) will also be accepted.
| pageSize | _optional_ | Enables paging mode with the specified size. |
| pageIndex | `0` | If paging mode is activated with `pageSize`, this is the page to start at.|
| defaultText | _empty string_ | If a cell's data is `undefined` or `null`, this string will be used.|


## Methods

The following are common methods that can be called from an external script.

| Name         | Arguments         | Description                                        |
| -------------|-----------------|----------------------------------------------------|
| sort       | (_optional_ `String` sortByColumn)       | Sorts by the specified column or `sortColumn` property. |
| update       | (_optional_ `Array` eventNames)       | Updates the table. You can pass names of events to call.     |
| watchTrigger       | (**Required** `Object` trigger)      | Adds an object to watch for changes.    |
| unwatchTriggers       | _no arguments_      | Stops watching all triggers (except `data`)    |
| setData       | (**Required** _mixed_ data)      | Sets the data. See documentation for the `data` option.    |
| movePage       | (**Required** `Number` change)      | Moves the page number using the value of _change_    |
| getPageTotal       | _no arguments_      | Gets the number of pages available based on data size.    |
| viewPage       | (**Required** `Number` pageIndex)      | Jumps to the page at _pageIndex_. Page numbers are zero-based, so the first page is `0`
| processChecks       | (_optional_ `Boolean` allChecks = `false`)      | Gets an `Array` of checked checkboxes or all checkboxes if _allChecks_ is `true`. Will return `null` if no matches exist in the table.
| getChecks       | _no arguments_     | Gets an `Array` of checked checkboxes. Will return an empty array if no checkboxes are checked.

## Properties

The following are properties that could be used by external code, _e.g._ during `onSort` or `compareItems`

| Name         | Default         | Description                                        |
| -------------|-----------------|----------------------------------------------------|
| sortColumn       | _undefined_       | A column name that's set by the `sort` method before calling `compareItems`|
| isReversed       | `false`       | If the table is sorted as descending. |
| dataSort       | _undefined_       | `Array` of data that has been sorted. Copied from `data`     |
| dataIsArray       | _no default_       | `Boolean` of whether data is an `Array`     |
| pageIndex       | `0`       | The current page being viewed if `pageSize` was set. Page numbers are zero-based, so the first page is `0`     |

## Interpreted Columns
| Column | Description |
|--------|-------------|
| `?` | Creates a checkbox element. See `onCheckChange` option.
| `@` | Outputs the row index, starting at zero
| `#` | Outputs the row number, starting at one
| `>` | Outputs the highest value in the row (`Number` or `Date`)
| `<` |  Outputs the lowest value in the row (`Number` or `Date`)

## Examples
### Custom Formatter
```javascript
    /* set the formatter option */  
    formatter: function(cell, column, row, index) {
        if (column == "age") {
            if (cell >= 65) {
                return "<span class=\"senior\">" + cell + "</span>";
            }
        } else if (column == "gender") {
            if (cell == "M") {
                return "<span class=\"blue\">" + cell + "</span>";
            } else if (cell == "F") {
                return "<span class=\"pink\">" + cell + "</span>";
            }
        }
        
        // fall back to the default formatter
        return this.formatCellHtml(cell);
    }
```
### Column/Row Attributes
```javascript
    /* set the column attributes option */ 
    new TableView({
        /* pass an array called "people" */
        data: people,
        
        /* other options go here */
        
        columnAttributes: {
            "age": {
                "class": "age-cell"
            },
            "gender": {
                "class": "bold-cell"
            }
        },
        /* Data is array, so row attributes define all rows' attributes. This is optional */
        rowAttributes: {
            "class": "my-row-class"
        }
    });
```
Some CSS for the table cells:
```css
td .bold-cell { font-weight: bold; }
td .age-cell { background-color: #ececec; }
tr .my-row-class { background-color: #f5f5f5; }
```

### Table Content As Data
```html
<table id="weather">
	 <colgroup>
		  <col width="160" />
		  <col width="50" />
		  <col width="120" />
	 </colgroup>
	 <thead>
		  <tr>
				<td>Day</td>
				<td>Temp</td>
				<td>Date</td>
		  </tr>
	 </thead>
	 <tbody>
		  <tr>
				<td>Tuesday</td>
				<td>76</td>
				<td data-column-type="Date">7/9/15</td>
		  </tr>
		  <tr>
				<td>Wednesday</td>
				<td>72</td>
				<td data-column-type="Date">7/10/15</td>
		  </tr>
		  <tr>
				<td>Thursday</td>
				<td>75</td>
				<td data-column-type="Date">7/11/15</td>
		  </tr>				  
	 </tbody>
</table>
```
And the JavaScript to initialize it:
```javascript
new TableView({
    table: "weather",
    columns: ['day','temp','date'],
    
    /* optional: make the date column look better */
	formatter: function(cell, column, row, index) {
		if (column == "date") {
			return cell.toLocaleDateString();
		}
		
		// fall back to the default formatter
		return this.formatCellHtml(cell);
	}
				
});
```

### Pivot Table

```javascript
var view = new TableView({
    table: "state_table",
    data: {
        "NY": "New York",
        "CA": "California",
        "RI": "Rhode Island"
    }
});
```

The HTML for the pivot table:
```html
<table id="state_table">
    <colgroup>
        <col width="50" id="columnStateCode" />
        <col width="250" id="columnStateName" />
    </colgroup>
    <thead>
        <tr>
            <td>Code</td>
            <td>Name</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td colspan="2">
                Data has not been loaded.
            </td>
        </tr>
    </tbody>
</table>
```

Advanced: You can pass `rowAttributes` and define certain rows' attributes using property names. This rule only applies to pivot table mode.

```javascript
rowAttributes: {
    "RI": {
        "contenteditable": "true",
        "class": "my-edit-cell"
    }
}
```

## License

The MIT License (MIT)

Copyright (c) 2015 Jesse Oliveira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.