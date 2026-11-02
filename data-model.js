export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// lesson:normalize:start
export function normalize(rows) {
  return rows.map(row => {
    const [year, month] = row.ReportPeriod.split(' ');
    return {
      date: `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-01`,
      name: row.Terminal,
      movement: row.Arrival_Departure,
      market: row.Domestic_International,
      value: Number(row.Passenger_Count.replaceAll(',', ''))
    };
  });
}
// lesson:normalize:end
// lesson:filter:start
export function filterRows(rows, { start, end, movement, market }) {
  return rows.filter(row =>
    row.date >= `${start}-01` && row.date <= `${end}-01` &&
    (movement === 'All' || row.movement === movement) &&
    (market === 'All' || row.market === market)
  );
}
// lesson:filter:end
// lesson:aggregate:start
export function aggregate(rows) {
  const totals = new Map();
  for (const { date, name, value } of rows) {
    const key = `${date}|${name}`;
    const item = totals.get(key) ?? { date, name, value: 0 };
    item.value += value;
    totals.set(key, item);
  }
  return [...totals.values()].sort((a, b) =>
    a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
// Keep a stable set of bars: a missing record is a display placeholder, not a measured zero.
export function completeFrames(totals, names) {
  const lookup = new Map(totals.map(row => [`${row.date}|${row.name}`, row]));
  const dates = [...new Set(totals.map(row => row.date))].sort();
  return dates.flatMap(date => names.map(name => {
    const reported = lookup.get(`${date}|${name}`);
    return reported ? { ...reported, missing: false } : { date, name, value: 0, missing: true };
  }));
}
// lesson:aggregate:end
export function dateLabel(date) {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}
