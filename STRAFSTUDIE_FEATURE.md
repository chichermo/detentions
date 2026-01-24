# Strafstudie Functionaliteit

## Overzicht

Deze functionaliteit biedt de mogelijkheid om op **maandag** een verlengde nablijven-sessie (strafstudie) te organiseren van **16:00 tot 17:40** in plaats van de normale tijd van 16:00 tot 16:50.

## Kenmerken

### 1. Beschikbaarheid
- **Alleen op maandag**: Deze optie is alleen beschikbaar voor nablijven sessies die op maandag plaatsvinden.
- **Verlengde periode**: 16:00 - 17:40 (in plaats van 16:00 - 16:50)

### 2. Periodes
Binnen de strafstudie kunnen 2 periodes van 50 minuten worden toegewezen:
- **Periode 1**: 16:00-16:50
- **Periode 2**: 16:50-17:40

### 3. Gebruik

#### Bij het aanmaken van een nieuwe nablijven
1. Selecteer een maandag als datum
2. Vul de leerling gegevens in
3. Vink het vakje "Strafstudie (16:00-17:40)" aan
4. Selecteer een periode van 50 minuten uit de dropdown

#### Bij het bewerken van een bestaande nablijven
1. Als de sessie op maandag is, is de optie "Straf" zichtbaar in de tabel
2. Klik op bewerken
3. Vink het vakje "Strafstudie" aan
4. Selecteer de gewenste periode

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
ADD COLUMN IF NOT EXISTS time_period TEXT CHECK (
  time_period IS NULL OR 
  time_period IN ('16:00-16:50', '16:50-17:40')
);
```

## Visuele Indicatoren

- **Header**: Toont "Strafstudie: 16u tot 17u40" wanneer er strafstudie actief is
- **Tabel**: Extra kolommen "Straf" en "Periode" worden alleen op maandag getoond
- **Formulier**: Het checkbox veld heeft een paarse kleur om het te onderscheiden van reguliere opties

## Validatie

- De periode is verplicht wanneer "Strafstudie" is aangevinkt
- De periode wordt automatisch gewist wanneer "Strafstudie" wordt uitgevinkt
- De optie is automatisch uitgeschakeld voor dinsdag en donderdag
- Er zijn 2 periodes van 50 minuten beschikbaar
