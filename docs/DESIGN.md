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
- Intent-baserad navigation:
  - `Videos` för sök/öppna/redigera video
  - `Insights` för statistik/trender
- Mode-switch i sidhuvud med tydlig aktiv state
- Videos-läge:
  - Teknik-tabbar + listning i selector
  - Detaljvy med video/overlay på huvudytan
- Insights-läge:
  - Tidsfilter + dashboard-kort
  - Fokus på analys, inte enskild video

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
- Tydlig intent före innehåll: användaren väljer först mål (Videos/Insights)

## Responsive riktlinjer
- History desktop: selector + content i två kolumner
- History mobile: content först, selector under
- Action-knappar i listkort får inte stretchas till full höjd
- Analyze steg 1: hjälpinformation under videoytan för naturligt läsflöde
