/**
 * Parse personeelsnamen (bulk / Excel).
 * Excel: kolommen Voornaam + Naam (of Achternaam) → "Voornaam Achternaam".
 * Plakken: één naam per regel, of Achternaam;Voornaam.
 */
import {
  fixSemicolonName,
  cellExact,
  normalizePersonName,
} from '@/lib/studentImport';

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
        // Achternaam;Voornaam → Voornaam Achternaam
        name = normalizePersonName(parts[1], parts[0]);
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

/**
 * Excel met 2 kolommen: Voornaam + Naam (achternaam), zoals Smartschool.
 * Ook: Voornaam + Achternaam, of één kolom met volledige naam.
 */
export function buildStaffName(row: Record<string, unknown>): string {
  const voornaam = cellExact(row, [
    'Voornaam',
    'First name',
    'Firstname',
    'First Name',
    'Voor',
  ]);
  const achternaam = cellExact(row, [
    'Achternaam',
    'Last name',
    'Lastname',
    'Last Name',
    'Familienaam',
  ]);
  // "Naam" = achternaam (Smartschool), niet de volledige naam als Voornaam ook bestaat
  const naam = cellExact(row, ['Naam', 'Name']);

  if (voornaam && (achternaam || naam)) {
    return normalizePersonName(voornaam, achternaam || naam);
  }
  if (voornaam && achternaam) {
    return normalizePersonName(voornaam, achternaam);
  }

  const full = cellExact(row, [
    'Personeel',
    'Volledige naam',
    'Volledige Naam',
    'Full name',
    'Leerkracht',
    'Teacher',
    'Docent',
    'Medewerker',
  ]);
  if (full) return fixSemicolonName(full);

  // Alleen "Naam" zonder voornaam → toch gebruiken (één kolom)
  if (naam && !voornaam) return fixSemicolonName(naam);
  if (voornaam) return normalizePersonName(voornaam);
  if (achternaam) return normalizePersonName(achternaam);

  return '';
}
