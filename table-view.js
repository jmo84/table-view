/*globals window console document define require module exports HTMLTableElement HTMLTableSectionElement */
(function(module) {
	"use strict";

	var TableView, errorList, raiseError, getKeys, bindEvents, stopEvent,
		watchTrigger, watchTriggerChanges, getWatcher, unwatchTrigger,
		defaultSort, getHighest, handleHeaderCellPress, 
		COLUMN_TYPE_PROPERTY_NAME = 1,
		COLUMN_TYPE_VALUE = 2,
		DEFAULT_EVENTS = ["Change", "Update"],
		OBJECT_COLUMNS = ["key", "value"],
		ATTRIBUTE_COLUMN_KEY = "data-column-key",
		INDEX_COLUMN_KEY = "@",
		ORDER_COLUMN_KEY = "#",
		CHECK_COLUMN_KEY = "?",
		HIGH_COLUMN_KEY = ">",
		LOW_COLUMN_KEY = "<",
		HAS_OBSERVE = typeof Object.observe === "function",
		RE_AMPERSAND = /&/g,
		RE_LESS_THAN = /</g,
		RE_GREATER = />/g,
		RE_QUOTE = /"/g,
		RE_APOSTROPHE = /'/g;
		
	
	TableView = function(settings) {
		var s = settings;

		if (!s) {
			raiseError("invalidSettings");
		}
		
		if (s.columns) {
			this.columns = s.columns;
		}

		if (s.columnAttributes) {
			this.columnAttributes = s.columnAttributes;
		}
		
		if (s.rowAttributes) {
			this.rowAttributes = s.rowAttributes;
		}
		
		if (s.table) {
			this.setTable(s.table, s.body || 0);
		}
		
		if (s.exclude) {
			this.exclude = s.exclude;
		}
		
		if (s.defaultText) {
			this.defaultText = s.defaultText;
		}
		
		this.sortClass = s.sortClass || "sorted";
		this.sortClassAscending = s.sortClassAscending || "sorted-asc";
		this.sortClassDescending = s.sortClassDescending || "sorted-desc";
		
		this.isRecursive = typeof s.isRecursive === "undefined" ? true : s.isRecursive;
		
		if (s.formatter) {
			if (typeof s.formatter === "function") {
				this.cellFormatter = s.formatter;
			} else {
				this.cellFormatter = this.formatCellHtml;
			}
		}
		
		if (s.compareItems) {
			if (typeof s.compareItems === "function") {
				this.compareItems = s.compareItems;
			}
		}
		
		this.setData(s.data);
		
		if (s.triggers) {
			this.watchTriggers(s.triggers);
		}
		
		if (s.onProcess) {
			this.onProcess = s.onProcess;
		}
		
		if (s.onCheckChange) {
			this.onCheckChange = s.onCheckChange;
		}
		
		bindEvents(this, this.updateEvents, s);
	
		if (s.pageSize) {
			this.pageSize = s.pageSize;
			this.pageIndex = s.pageIndex || 0;
		}
		
		if (s.sortColumn) {
			this.sort(s.sortColumn);
			this.update();
		}		
	};
	
	TableView.prototype.updateEvents = DEFAULT_EVENTS;

	TableView.prototype.generateBody = function() {
		var isArray = this.dataIsArray,
			data = isArray ? (this.dataSort || this.data) : this.keys,
			isReversed = this.isReversed,
			pageSize = this.pageSize || 0,
			i, start, end, delta, row, bh = "";
			 
		if (isReversed) {
			start = data.length - 1;
			end = 0;
			delta = -1;
			if (pageSize) {
				start = Math.max(start - (this.pageIndex * pageSize), end);
				end = Math.max((start - pageSize)+1, 0);
			}
		} else {
			end = pageSize ? Math.min((this.pageIndex + 1) * pageSize, data.length) : data.length;
			start = pageSize ? this.pageIndex * pageSize : 0;
			delta = 1;
		}

		for (i = start; isReversed ? i >= end: i < end; i += delta) {
			row = data[i];
			if (isArray) {
				bh += this.generateRowHtml(row, i);
			} else {
				bh += this.generateRowHtml(this.data, i, row);
			}
		}

		return bh;
	};
	
	TableView.prototype.generateRowHtml = function(row, i, propertyName) {
		var c, rh, column, cell, sortClasses,
			sortColumn = this.sortColumn, isSorted,
			columnAttributes = this.columnAttributes,
			rowAttributes = this.rowAttributes,
			hasCellAttributes, specialColumn,
			cellAttributes,
			columns = this.columns,
			columnTotal = columns ? columns.length : 0,
			formatter = this.cellFormatter;

			
		if (propertyName && rowAttributes) {
			if (rowAttributes[propertyName]) {
				rowAttributes = rowAttributes ? rowAttributes[propertyName] : null;
			}
			hasCellAttributes = rowAttributes && rowAttributes.cellAttributes;
		}

		rh = "<tr" + this.generateAttributeHtml(rowAttributes) + ">";				
					
		
		for (c = 0; c < columnTotal; c++) {
			column = columns[c];
			specialColumn = false;
			
			if (column === COLUMN_TYPE_VALUE) {
				cell = row[propertyName];
			} else if (column === COLUMN_TYPE_PROPERTY_NAME) {
				cell = propertyName;
			} else if (column === INDEX_COLUMN_KEY) {
				cell = i.toString();
				specialColumn = true;
			} else if (column === ORDER_COLUMN_KEY) {
				cell = (i + 1).toString();
				specialColumn = true;
			} else if (column === CHECK_COLUMN_KEY) {
				cell = this.generateCheckHtml(row);
				specialColumn = true;
			} else if (column === HIGH_COLUMN_KEY) {
				cell = getHighest(row);
			} else if (column === LOW_COLUMN_KEY) {
				cell = getHighest(row, false);
			} else {
				cell = row[column];
				if (column === sortColumn) {
					isSorted = true;
				}
			}
			
			if (hasCellAttributes) {
				cellAttributes = rowAttributes.cellAttributes[OBJECT_COLUMNS[c]];
			} else {
				cellAttributes = columnAttributes ? columnAttributes[column] : null;
			}
			
			if (isSorted) {
				sortClasses = this.sortClass + " " + (this.isReversed ?
					this.sortClassDescending :
					this.sortClassAscending);
				
				if (!cellAttributes) {
					cellAttributes = {};
				}
				if (!cellAttributes["class"]) {
					cellAttributes["class"] = sortClasses;
				} else {
					cellAttributes["class"] += " " + sortClasses;
				}
				isSorted = false;
			}
			
			rh += "<td" + this.generateAttributeHtml(cellAttributes) + ">";
			rh += (formatter && !specialColumn ? formatter.call(this, cell, column, row, i) : cell) + "</td>";
		}
		
		return rh + "</tr>";
						
	};
	
	TableView.prototype.generateAttributeHtml = function(attributesHash, prefix) {
		var attributeName, value, html = '';
		if (!!attributesHash && typeof attributesHash === 'object') {
			for (attributeName in attributesHash) {
				if (attributesHash.hasOwnProperty(attributeName) &&
					attributeName !== 'cellAttributes') {
					value = this.formatCellHtml(attributesHash[attributeName]);
					html += ' ' + (prefix || '') + attributeName + '="' + value + '"';
				}
			}
		}
		return html;
	};
	
	TableView.prototype.generateCheckHtml = function(row) {
		return '<input type="checkbox" ' + this.generateAttributeHtml(row,'data-') + '/>';
	};

	TableView.prototype.formatCellJson = function(data) {
		var text = JSON.stringify(data);
		return text;
	};
	
	TableView.prototype.formatCellHtml = function(data) {
		var r, text, type = typeof data;
		
		if (type === "undefined" || type === "null") {
			text = this.defaultText || "";	
		} else {
			text = data.toString();
		}
		
		r = text.replace(RE_AMPERSAND, "&amp;")
		.replace(RE_LESS_THAN, "&lt;")
		.replace(RE_GREATER, "&gt;")
		.replace(RE_QUOTE, "&quot;")
		.replace(RE_APOSTROPHE, "&#039;");

		return r;
	};
	
	TableView.prototype.update = function(eventNames) {
		var html, i, eventName, eventHandler;
		
		html = this.generateBody();
		this.tableBody.innerHTML = html;
		
		if (this.onCheckChange) {
			this.processChecks();
		}
		
		if (eventNames && eventNames.length) {
			for (i = 0; i < eventNames.length; i++) {
				eventName = "on" + eventNames[i];
				eventHandler = this[eventName];
				if (typeof eventHandler === "function") {
					eventHandler.call(this);
				}
			}
		}
		
	};
	
	TableView.prototype.processChanges = function(changes) {

		if (typeof this.onProcess === "function") {
			if (this.onProcess(changes)===false) {
				return;					
			}
		}
		
		if (this.dataSort) {
			delete this.dataSort;
		}
		
		if (!this.dataIsArray) {
			this.keys = getKeys(this.data, this.exclude || []);
		}
		
		this.sort(this.sortColumn);
		this.update(this.updateEvents);
	};
	
	TableView.prototype.sort = function(sortColumn, canReverse) {
		var tableView, isValueSort, isKeySort, key, keys, i,
			shouldReverse = !!canReverse;
			
		if (!sortColumn) {
			return;
		}
		
		if (this.sortColumn != sortColumn) {
			if (shouldReverse) {
				this.isReversed = !this.sortColumn && sortColumn == INDEX_COLUMN_KEY;
			}
			this.sortColumn = sortColumn;
		} else if (shouldReverse) {
			this.isReversed = !this.isReversed;
		}

		if (sortColumn == INDEX_COLUMN_KEY) {
			return;	
		}
		
		if (this.dataIsArray) {
			this.dataSort = this.data.slice(0);
		} else {
			isKeySort = sortColumn === OBJECT_COLUMNS[0];
			if (isKeySort) {
				this.dataSort = this.keys.slice(0);
				//sortColumn = null;
			} else {
				isValueSort = true;
				this.dataSort = [];
				keys = this.keys || [];
				for (i = 0; i < keys.length; i++) {
					key = keys[i];
					this.dataSort.push({
						key: key,
						value: this.data[key]
					});
				}
			}				
		}
		
		if (this.compareItems) {
			tableView = this;
			this.dataSort.sort(function(v1, v2) {
				if (isValueSort) {
					return tableView.compareItems(v1.value, v2.value);
				} else {
					return tableView.compareItems(v1, v2);
				}
			});
		} else {
			this.dataSort.sort(function(v1, v2) {
				if (isValueSort) {
					return defaultSort(v1.value, v2.value);
				} else {
					return defaultSort(v1, v2, isKeySort ? null : sortColumn);
				}					
			});
		}
		
		if (isValueSort) {
			this.keys = [];
			for (i = 0; i < this.dataSort.length; i++) {
				key = this.dataSort[i].key;
				this.keys.push(key);					
			}
		} else if (isKeySort) {
			this.keys = this.dataSort;
		}
		
		this.updateHeader(sortColumn);
	};
	
	TableView.prototype.processChecks = function(allChecks) {
		var i, c, row, rows, cellElement, cellChild,
			c2, cellChildren, checkIndex,
			self = this,
			tbody = this.tableBody,
			queryResults = null;
			
					
		if (tbody && tbody.rows) {
			rows = tbody.rows;
			for (i = 0; i < rows.length; i++) {
				row = rows[i];
				for (c = 0; c < row.children.length; c++) {
					cellElement = row.children[c];
					cellChildren = cellElement.children;
					checkIndex = -1;
					for (c2 = 0; c2 < cellChildren.length; c2++) {
						cellChild = cellChildren[c2];
						if (!(cellChild instanceof HTMLInputElement)) {
							continue;
						}
						
						if (!cellChild.type || cellChild.type.toLowerCase() !== "checkbox") {
							continue;
						}
						
						checkIndex++;
						
						if (cellChild.getAttribute('data-check-index')) {
							if (cellChild.checked || allChecks) {
								if (!queryResults) {
									queryResults = [];
								}
								
								queryResults.push(cellChild);
							}
						} else {
							cellChild.setAttribute('data-check-index', checkIndex.toString());
							cellChild.addEventListener("change", function(e) {
								var indexChecked = parseInt(cellChild.getAttribute('data-check-index'), 10);
								if (typeof self.onCheckChange === "function") {
									self.onCheckChange.call(this, this.checked, indexChecked);
								}
							});							
						}
					}
				}
			}
		}
		
		return queryResults;
	};
	
	TableView.prototype.getChecks = function() {
		return this.processChecks() || [];
	};
	
	TableView.prototype.releaseData = function() {
		var oldData;
		
		if (this.data) {
			oldData = this.data;
			delete this.data;
			delete this.dataIsArray;
			if (this.observeChanges) {
				Object.unobserve(oldData, this.observeChanges);
				delete this.observeChanges;
			}
		}
		
		if (this.dataSort) {
			delete this.dataSort;
		}
	};
	
	TableView.prototype.setData = function(data) {
		var table = this;

		this.releaseData();
		
		if (typeof data === "undefined" || typeof data === "string") {
			return this.setData(this.getDataFromTable(data));
		} else if (data) {
			this.data = data;
			this.dataIsArray = (data instanceof Array);
			
			if (!this.dataIsArray) {
				this.keys = getKeys(data, this.exclude || []);
				this.columns = [COLUMN_TYPE_PROPERTY_NAME, COLUMN_TYPE_VALUE];
			}

			if (HAS_OBSERVE) {
				
				this.observeChanges = function(changes) {
					table.processChanges(changes);
				};
			
				(getWatcher(function(o) {

					Object.observe(o, table.observeChanges);

				}, !this.isRecursive))(data);
			}
		}
		
		this.sort(this.sortColumn);
	};
	
	TableView.prototype.getDataFromTable = function(name) {
		var data = [], i, c, row, o, t, ct, rows,
			tbody = this.tableBody,
			columns = this.columns;
			
		if (name) {
			tbody = document.getElementById(name);
			if (tbody) {
				tbody = tbody.tBodies[0];
			}
		}
		
		if (tbody && columns) {
			rows = tbody.rows;
			if (rows) {
				for (i = 0; i < rows.length; i++) {
					row = rows[i];
					o = {};
					for (c = 0; c < row.children.length; c++) {
						ct = row.children[c].getAttribute("data-column-type");
						t = row.children[c].innerText;
						if (ct) {
							ct = ct.toLowerCase();
							if (ct === "date") {
								t = new Date(t);
							} else if (ct === "number") {
								t = parseFloat(t);
							}
						}
						
						if (columns.length > 0 && c < columns.length) {
							o[columns[c]] = t;
						}
					}
					data.push(o);	
				}
			}
		}
		return data;
	};
	
	
	TableView.prototype.setTable = function(table, body) {
		
		
		if (typeof table === "string" && typeof document !== "undefined") {
			this.table = document.getElementById(table);
		} else {
			this.table = table;
		}
		
		if (!this.table instanceof HTMLTableElement) {
			raiseError("invalidTable");
		} else {
			if (body instanceof HTMLTableSectionElement) {
				this.tableBody = body;
			} else {
				this.tableBody = this.table.tBodies[body];
			}
			this.setTableHeaderEvents();
		}
		
	};
	
	TableView.prototype.iterateHeaderCells = function(callback) {
		var rows, headCells, headCell, i, table, result;

		if (!this.table || !this.table.tHead) {
			return;
		}
		
		rows = this.table.tHead.rows;
		if (rows && rows.length > 0) {
			headCells = rows[0].children;
			if (!headCells || !headCells.length) {
				return;
			}
			
			table = this;
			for (i = 0; i < headCells.length; i++) {
				headCell = headCells[i];
				result = callback.call(this, headCell, i);
				if (result !== undefined) {
					return result;
				}
			} 
		}
					
	};

	TableView.prototype.setTableHeaderEvents = function() {
		var table = this,
			columns = table.columns,
			isTouch = ("ontouchstart" in window),
			eventName = isTouch ? "touchstart" : "mousedown";

		if (!columns) {
			
			if (!table.dataIsArray) {
				columns = OBJECT_COLUMNS;
			} else {
				return;
			}
		}
		
		this.iterateHeaderCells(function(headCell, i) {
			headCell.setAttribute(ATTRIBUTE_COLUMN_KEY, columns[i]);
			
			headCell.addEventListener(eventName, function(e) {
				return handleHeaderCellPress.call(this, e, table);
			});
			
		});

	};
	
	TableView.prototype.updateHeader = function(sortColumn) {
		var table = this;
		this.iterateHeaderCells(function(cell, i) {
			var headCellKey = cell.getAttribute(ATTRIBUTE_COLUMN_KEY),
			sortClass = table.sortClass,
			sortDesc = table.sortClassDescending,
			sortAsc = table.sortClassAscending;
			
			if (!cell.classList) {
				return;
			}
			
			if (sortColumn && headCellKey === sortColumn) {
				cell.classList.add(sortClass);
				cell.classList.remove(!table.isReversed ? sortDesc : sortAsc);						
				cell.classList.add(table.isReversed ? sortDesc : sortAsc);
			} else {
				cell.classList.remove(sortClass);
				cell.classList.remove(sortAsc);
				cell.classList.remove(sortDesc);
			}
		});			
	};
	
	getWatcher = function(watchCallback, isShallow/*=false*/) {
		var f,
			shallow = arguments.length > 1 && !!arguments[1];

		f = function(o) {
			var k, v;
			
			if (!o || typeof o !== 'object') {
				return;
			}
			
			watchCallback(o);
			
			if (!shallow) {
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						v = o[k];
						f(v);
					}
				}
			}
			
		};
		return f;
	};
	
	TableView.prototype.watchTriggers = function(triggers) {
		var i, tableView = this;
		
		if (!triggers || !HAS_OBSERVE) {
			return;	
		}

		watchTriggerChanges = function() {
			tableView.update();
		};
		
		watchTrigger = getWatcher(function(o) {
			Object.observe(o, watchTriggerChanges);
		}, !this.isRecursive);

		for (i = 0; i < triggers.length; i++) {
			watchTrigger(triggers[i]);
			if (!this.triggers) {
				this.triggers = [];
			}
			this.triggers.push(triggers[i]);
		}
	};
	
	TableView.prototype.unwatchTriggers = function() {
		var i, triggers = this.triggers;

		if (!watchTriggerChanges || !triggers || !HAS_OBSERVE) {
			return;
		}
		
		unwatchTrigger = getWatcher(function(o) {
			Object.unobserve(o, watchTriggerChanges);
		});
		
		for (i = 0; i < triggers.length; i++) {
			unwatchTrigger(triggers[i]);
		}
		watchTriggerChanges = null;
	};
	
	TableView.prototype.movePage = function(change) {
		var delta = change || 1,
			pages = this.getPageTotal();
			
		if (!this.pageSize) {
			return;
		}

		this.viewPage(this.pageIndex + delta);
	};
	
	TableView.prototype.viewPage = function(pageIndex) {
		var pages;
		if (!this.pageSize) {
			return;
		}
		
		pages = this.getPageTotal();
		
		this.pageIndex = pageIndex;
		if (this.pageIndex < 0) {
			this.pageIndex = 0;
		} else if (this.pageIndex > pages - 1) {
			this.pageIndex = Math.max(pages - 1, 0);
		}
		
		this.update();			
	};
	
	TableView.prototype.getPageTotal = function(change) {
		var p = 0,
			isArray = this.dataIsArray,
			data = isArray ? (this.dataSort || this.data) : this.keys,
			pageSize = this.pageSize;
			
		if (pageSize && data && data.length > 0) {
			p = Math.ceil(data.length / pageSize);							
		}
		
		return p;
	};		
	
	handleHeaderCellPress = function(e, table) {
		var j, columnKey,
			siblingIndex = -1,
			siblings = this.parentNode.children;

		for (j = 0; j < siblings.length; j++) {
			if (siblings[j] === this) {
				siblingIndex = j;
				break;
			}
		}
		
		if (siblingIndex >= 0) {
			columnKey = this.getAttribute(ATTRIBUTE_COLUMN_KEY);
			if (table.dataSort) {
				delete table.dataSort;
			}
			table.sort(columnKey, true);
			table.update(["Sort","Update"]);							
		}
		
		return stopEvent(e);			
	};
	
	defaultSort	= function(v1, v2, sortColumn) {

		var data1, data2;
		
		if (sortColumn) {
			data1 = v1[sortColumn];
			data2 = v2[sortColumn];
		} else {
			data1 = v1;
			data2 = v2;
		}
		
		if (data1 !== data2) {
			if (data1 < data2) {
				return -1;
			}
			
			if (data1 > data2) {
				return 1;
			}
		}
		
		return 0;			
	};
	
	stopEvent = function (e) {
		if (e.stopPropagation) e.stopPropagation();
		if (e.preventDefault) e.preventDefault();
		e.cancelBubble = true;
		e.returnValue = false;
		return false;
	};

	bindEvents = function(table, names, source) {
		var i, name, handler;
		
		for (i = 0; i < names.length; i++) {
			name = "on" + names[i];
			handler = source[name];
			if (typeof handler === "function") {
				table[name] = handler;
			}
		}
	};
	
	getKeys = function(data, exclude) {
		var key, keys = [];
		
		for (key in data) {
			if (data.hasOwnProperty(key) && exclude.indexOf(key) < 0) {
				keys.push(key);	
			}
		}
		
		keys.sort();
		
		return keys;
	};
	
	getHighest = function(data, lowest) {
		var key, v, r;
		
		for (key in data) {
			if (data.hasOwnProperty(key)) {
				v = data[key];
				if (typeof r === "undefined") {
					r = v;
				} else if (typeof r==="string") {
					
				} else if (lowest) {
					if (v < r) {
						r = v;
					}
				} else {
					if (v > r) {
						r = v;
					}
				}
 			}
		}
		
		return r;
	};
	
	raiseError = function(errorName) {
		
		var errorData = errorList[errorName],
			errorType = errorData.type || Error,
			text = 'Table Error: ' + errorData.text;
			
		throw errorType(text);
	};
	
	errorList = {
		invalidTable: {
			text: "Table is not valid."
		},
		invalidSettings: {
			text: "Settings are not valid."
		}
	};
	
	module.exports.TableView = TableView;

})((function() {
	if (typeof module === "undefined") {
		return {
			exports: typeof document === "undefined" ? {} : window
		};
	} else {
		return module;
	}	
})());