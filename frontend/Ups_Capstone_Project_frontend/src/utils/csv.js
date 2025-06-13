export function toCsv(data) {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => keys.map(k => '"' + (row[k] ?? '') + '"').join(','));
  return [header, ...rows].join('\n');
} 