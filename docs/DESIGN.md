# 🎨 Design

## Designprinciper
- Minimalistisk, men resultatfokuserad
- Snabb att använda med tydligt steg-fokus
- Data ska motivera handling, inte bara visas
- Professionell träningskänsla med visuella belöningar

## Färger och tonalitet
- Bas: vit och ljus grå (`#fff`, `#f8f9fa`)
- Primär accent: blå (`#007bff`, `#0f4c8a`)
- Positiv handling: grön (`#28a745`)
- Varning/farlig handling: röd (`#dc3545`)
- Video-scen: svart (`#000`)

## Layout

### Home
- Hero med tydlig värdeproposition
- Teknikväljare (sport + teknik)
- Upload/Record som huvud-CTA

### Analyze
- Wizard-flöde med 4 steg:
  1. Rita/Redigera
  2. Feedback
  3. Nästa steg
  4. Spara
- Endast en uppgift i fokus per steg
- I steg 2-4 döljs videoytan för lägre kognitiv belastning
- Efter sparning visas handlingspanel: `Se i historik` / `Öva och spela in igen`

### History
- Två nivåer:
  1. Gamified dashboard (överst)
  2. Gruppad analyslista (sport -> teknik)
- Dashboard-kort:
  - KPI-rad
  - Level/XP-kort med badges
  - Feedbacktrend över tid
  - Vanligaste feedbackpunkter
  - Teknikprogress-kort
- Detaljvy behåller video, overlays, redigering och borttagning

## Gamification-komponenter
- XP-modell:
  - Pass ger baspoäng
  - Feedback och Nästa steg ger extra poäng
- Levels:
  - Fast XP-tröskel per nivå
  - Progressbar visar avstånd till nästa nivå
- Badges:
  - Aktivitet (första passet, veteran)
  - Konsekvens (streak)
  - Reflektion (hög feedbackdensitet)

## UX-principer
- Från analys till beslut: användaren ska direkt se vad som upprepas över tid
- Tydlig progression: varje sparad analys ska kännas som framsteg
- Friktion först där det behövs: destruktiva actions kräver bekräftelsemodal
- Allt viktigt ska vara synligt utan att lämna sidan
