/**
 * Parse personeelsnamen (bulk / Excel).
 * Formaten: "Voornaam Achternaam", "Achternaam;Voornaam", één naam per regel.
 */
import { fixSemicolonName, cellExact } from '@/lib/studentImport';

export function parseBulkStaffLines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let name = '';
    if (/[;\t]/.test(line)) {
      const parts = line.split(/[;\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Achternaam;Voornaam
        name = fixSemicolonName(`${parts[0]};${parts[1]}`);
      } else {
        name = fixSemicolonName(parts[0] || line);
      }
    } else {
      name = fixSemicolonName(line);
    }
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function buildStaffName(row: Record<string, unknown>): string {
  const direct = cellExact(row, [
    'Personeel',
    'Naam',
    'Name',
    'Leerkracht',
    'Teacher',
    'Docent',
    'Medewerker',
  ]);
  if (direct) return fixSemicolonName(direct);

  const first = cellExact(row, ['Voornaam', 'First name', 'FirstName', 'Voor']);
  const last = cellExact(row, ['Achternaam', 'Last name', 'LastName', 'Naam', 'Familienaam']);
  if (first || last) {
    if (first && last) return fixSemicolonName(`${last};${first}`);
    return fixSemicolonName(first || last);
  }
  return '';
}
