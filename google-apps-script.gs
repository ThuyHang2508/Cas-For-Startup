const CUSTOMER_SHEET = 'Customers';
const HISTORY_SHEET = 'Status History';
const REPORT_SHEET = 'Monthly Reports';

const CUSTOMER_HEADERS = [
  'id','company','contact','phone','email','taxId','website','source','created','status',
  'qualification','owner','followup','apiInterest','product','contractLink','appendixLink','note','updatedAt'
];

const HISTORY_HEADERS = [
  'timestamp','customerId','company','fromStatus','toStatus','owner'
];
const REPORT_HEADERS = ['month','content','updatedAt'];

function doGet() {
  try {
    return json_({
      ok: true,
      customers: readObjects_(getSheet_(CUSTOMER_SHEET, CUSTOMER_HEADERS), CUSTOMER_HEADERS),
      history: readObjects_(getSheet_(HISTORY_SHEET, HISTORY_HEADERS), HISTORY_HEADERS),
      reports: readReports_()
    });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  let hasLock = false;
  try {
    lock.waitLock(10000);
    hasLock = true;
    const payload = JSON.parse(event && event.postData ? event.postData.contents || '{}' : '{}');
    if (payload.action !== 'sync' || !Array.isArray(payload.customers)) {
      return json_({ ok: false, error: 'Invalid payload' });
    }

    const customerSheet = getSheet_(CUSTOMER_SHEET, CUSTOMER_HEADERS);
    const historySheet = getSheet_(HISTORY_SHEET, HISTORY_HEADERS);
    const oldCustomers = readObjects_(customerSheet, CUSTOMER_HEADERS);
    const oldById = {};
    oldCustomers.forEach(item => oldById[String(item.id)] = item);

    const now = new Date().toISOString();
    const historyRows = [];
    payload.customers.forEach(customer => {
      const previous = oldById[String(customer.id)];
      if (!previous || String(previous.status) !== String(customer.status)) {
        historyRows.push([
          now,
          customer.id || '',
          customer.company || '',
          previous ? previous.status || '' : '',
          customer.status || '',
          customer.owner || ''
        ]);
      }
    });

    const customerRows = payload.customers.map(customer =>
      CUSTOMER_HEADERS.map(key => key === 'updatedAt' ? now : (customer[key] ?? ''))
    );
    customerSheet.clearContents();
    customerSheet.getRange(1, 1, 1, CUSTOMER_HEADERS.length).setValues([CUSTOMER_HEADERS]);
    customerSheet.setFrozenRows(1);
    if (customerRows.length) {
      const customerRange = customerSheet.getRange(2, 1, customerRows.length, CUSTOMER_HEADERS.length);
      customerRange.setNumberFormat('@');
      customerRange.setValues(customerRows);
    }
    if (historyRows.length) {
      historySheet.getRange(historySheet.getLastRow() + 1, 1, historyRows.length, HISTORY_HEADERS.length).setValues(historyRows);
    }
    writeReports_(payload.reports || {});

    return json_({
      ok: true,
      count: customerRows.length,
      history: readObjects_(historySheet, HISTORY_HEADERS),
      reports: readReports_()
    });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  } finally {
    if (hasLock) lock.releaseLock();
  }
}

function getSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    migrateHeaders_(sheet, headers);
  }
  return sheet;
}

function migrateHeaders_(sheet, headers) {
  const lastColumn = sheet.getLastColumn();
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  if (headers.every((header, index) => currentHeaders[index] === header)) return;
  const oldRows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues()
    : [];
  const migratedRows = oldRows.map(row => headers.map(header => {
    const oldIndex = currentHeaders.indexOf(header);
    return oldIndex >= 0 ? row[oldIndex] : '';
  }));
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  if (migratedRows.length) {
    const range = sheet.getRange(2, 1, migratedRows.length, headers.length);
    range.setNumberFormat('@');
    range.setValues(migratedRows);
  }
}

function readObjects_(sheet, headers) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return values.slice(1).filter(row => row.some(value => value !== '')).map(row => {
    const item = {};
    headers.forEach((key, index) => {
      const value = row[index];
      item[key] = value instanceof Date
        ? (key === 'month'
          ? Utilities.formatDate(value, timezone, 'yyyy-MM')
          : (key === 'created' || key === 'followup'
            ? Utilities.formatDate(value, timezone, 'yyyy-MM-dd')
            : value.toISOString()))
        : (value ?? '');
    });
    if ('id' in item) item.id = Number(item.id) || item.id;
    return item;
  });
}

function readReports_() {
  const rows = readObjects_(getSheet_(REPORT_SHEET, REPORT_HEADERS), REPORT_HEADERS);
  const reports = {};
  rows.forEach(row => {
    const month = String(row.month || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) reports[month] = String(row.content || '');
  });
  return reports;
}

function writeReports_(reports) {
  const sheet = getSheet_(REPORT_SHEET, REPORT_HEADERS);
  const now = new Date().toISOString();
  const rows = Object.keys(reports).sort().map(month => [month, reports[month] || '', now]);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, REPORT_HEADERS.length).setValues([REPORT_HEADERS]);
  sheet.setFrozenRows(1);
  if (rows.length) {
    const range = sheet.getRange(2, 1, rows.length, REPORT_HEADERS.length);
    range.setNumberFormat('@');
    range.setValues(rows);
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
