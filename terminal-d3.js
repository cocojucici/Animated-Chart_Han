// Official D3 7.9.0 distribution, bundled locally for GitHub Pages and offline use.
import './vendor/d3.v7.min.js';
const d3 = globalThis.d3;
const parseMonth = d3.utcParse('%Y %b %d');
const isoMonth = d3.utcFormat('%Y-%m-01');
const countFormat = d3.format(',d');

export function terminalRow(row) {
  const month = parseMonth(row.ReportPeriod.slice(0, 11));
  const value = Number(row.Passenger_Count.replaceAll(',', ''));
  if (!month || !Number.isFinite(value)) throw new Error('Invalid terminal observation');
  return {date:isoMonth(month), name:row.Terminal, movement:row.Arrival_Departure,
    market:row.Domestic_International, value};
}
export async function loadTerminalRows(url) {
  // Quoted passenger counts remain intact before the row converter removes commas.
  const rows = await d3.csv(url, terminalRow);
  return rows;
}
export function terminalTotals(rows) {
  const groups = d3.rollups(rows,
    records => d3.sum(records, d => d.value),
    d => d.date, d => d.name);
  return groups.flatMap(([date, terminals]) => terminals.map(([name, value]) => ({date, name, value})))
    .sort((a, b) => d3.ascending(a.date, b.date) || d3.ascending(a.name, b.name));
}
export function terminalColorMap(names, palette) {
  const color = d3.scaleOrdinal()
    .domain(names).range(palette)
    .unknown('#667b95');
  return Object.fromEntries(names.map(name => [name, color(name)]));
}
export function markTerminalMissing(selector, frame) {
  const missing = new Set(frame.filter(d => d.missing).map(d => d.name));
  d3.select(selector).selectAll('text.label')
    .filter(function(d) { return d && this.textContent !== d.name + (missing.has(d.name) ? ' *' : ''); })
    .text(d => d.name + (missing.has(d.name) ? ' *' : ''));
}
export function updateTerminalTable(selector, frame) {
  const rows = d3.select(selector).selectAll('tr')
    .data(frame, d => d.name)
    .join('tr');
  rows.selectAll('td')
    .data(d => [d.name, d.missing ? 'Not reported' : countFormat(d.value)])
    .join('td').text(d => d);
}
export function updateTerminalMonth(selector, label, animate) {
  const month = d3.select(selector);
  if (month.text() === label) return;
  month.interrupt('month-cue').text(label);
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reduced) { month.style('opacity', 1); return; }
  month.style('opacity', 0.55)
    .transition('month-cue').duration(240)
    .ease(d3.easeCubicOut).style('opacity', 1);
}
