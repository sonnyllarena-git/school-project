function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCsv(text) {
  const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

function csvEscape(value) {
  let str;
  if (value === null || value === undefined) {
    str = '';
  } else if (value instanceof Date) {
    str = value.toISOString().slice(0, 10); // DATE columns come back as JS Date objects from pg
  } else {
    str = String(value);
  }
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(columns, rows) {
  const header = columns.join(',');
  const body = rows.map(row => columns.map(c => csvEscape(row[c])).join(',')).join('\n');
  return rows.length > 0 ? `${header}\n${body}\n` : `${header}\n`;
}

module.exports = { parseCsv, toCsv };
