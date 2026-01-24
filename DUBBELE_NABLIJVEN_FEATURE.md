# Dubbele Nablijven Functionaliteit

## Overzicht

Deze functionaliteit biedt de mogelijkheid om op **maandag** een verlengde nablijven-sessie te organiseren van **16:00 tot 17:40** in plaats van de normale tijd van 16:00 tot 16:50.

## Kenmerken

### 1. Beschikbaarheid
- **Alleen op maandag**: Deze optie is alleen beschikbaar voor nablijven sessies die op maandag plaatsvinden.
- **Verlengde periode**: 16:00 - 17:40 (in plaats van 16:00 - 16:50)

### 2. Tijdvakken
Binnen de dubbele periode kunnen meerdere tijdvakken van 15 minuten worden toegewezen:
- 16:00-16:15
- 16:15-16:30
- 16:30-16:45
- 16:45-17:00
- 17:00-17:15
- 17:15-17:30
- 17:30-17:40

### 3. Gebruik

#### Bij het aanmaken van een nieuwe nablijven
1. Selecteer een maandag als datum
2. Vul de leerling gegevens in
3. Vink het vakje "Dubbele nablijven (16:00-17:40)" aan
4. Selecteer een tijdvak van 15 minuten uit de dropdown

#### Bij het bewerken van een bestaande nablijven
1. Als de sessie op maandag is, is de optie "Dubbel" zichtbaar in de tabel
2. Klik op bewerken
3. Vink het vakje "Dubbele nablijven" aan
4. Selecteer het gewenste tijdvak

## Technische Details

### Database Wijzigingen
Twee nieuwe velden zijn toegevoegd aan de `detentions` tabel:
- `is_double_period` (boolean): Geeft aan of het een dubbele nablijven is
- `time_period` (text): Het specifieke tijdvak (optioneel, alleen wanneer `is_double_period` waar is)

### Migratie
Voer de migratie uit met het bestand: `supabase/migration_dubbele_nablijven.sql`

```sql
-- Voer dit uit in je Supabase SQL editor
ALTER TABLE detentions 
ADD COLUMN IF NOT EXISTS is_double_period BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_period TEXT;
```

## Visuele Indicatoren

- **Header**: Toont "Dubbele periode: 16u tot 17u40" wanneer er dubbele nablijven zijn
- **Tabel**: Extra kolommen "Dubbel" en "Tijdvak" worden alleen op maandag getoond
- **Formulier**: Het checkbox veld heeft een paarse kleur om het te onderscheiden van reguliere opties

## Validatie

- Het tijdvak is verplicht wanneer "Dubbele nablijven" is aangevinkt
- Het tijdvak wordt automatisch gewist wanneer "Dubbele nablijven" wordt uitgevinkt
- De optie is automatisch uitgeschakeld voor dinsdag en donderdag
