# 🚀 Features

## 1. Video Upload & Recording
- Ladda upp video från enhet (mobil och desktop)
- Spela in video direkt via kamera med codec-fallback (vp9 → vp8 → webm → mp4)
- Flera filer kan importeras samtidigt till biblioteket

## 2. Skill Picker (delad komponent)
- Gemensam komponent i Home och Analyze
- Välj sport (Beachvolley / Volleyboll / Tennis-pilot) och teknik
- Analyze steg 3 visar endast picker om teknik saknas

## 3. Analyze Wizard
- Steg: `Rita` → `Feedback` → `Nästa steg` → `Spara`
- Steg 1 visar videoyta + ritverktyg
- Stegpanelen visas under innehållet i steg 1

## 4. Ritverktyg och Overlay
- Linje och cirkel över video
- Tidsstyrning per shape med `visibleFrom` / `visibleTo`
- ShapeOverlay renderas i Analyze och History

## 5. Metadata i videofilen
- Vid export bäddas hela analysen in i videons metadata (`comment=bcoach:<base64-json>`)
- Metadata läses tillbaka från videon med FFmpeg
- Exporterad fil laddas ner och indexeras i biblioteket

## 6. Video Library (IndexedDB)
- Persistens i IndexedDB (inte localStorage)
- Sparar blob + metadata + källa (`imported` / `exported`)
- Stöd för listning, öppning, borttagning och uppdatering
- Äldre poster utan metadata kan hydreras från blob automatiskt

## 7. History: Intent-baserad vy
- Två lägen med URL-state:
	- `Videos` (`/history`)
	- `Insights` (`/history?view=insights`)
- `Videos`: fokus på välja, spela upp, öppna i Analyze, ta bort
- `Insights`: fokus på statistik och trender

## 8. Insights Dashboard
- Tidsfilter: `7 dagar`, `30 dagar`, `Alla`
- KPI-kort, XP/Level, badges
- `Feedback over tid`
- `Vanligaste feedbackpunkter`
- `Teknikprogress`

## 9. Responsive History
- Desktop: selector + detail i två kolumner
- Mobile: detail först, selector under
- Fix för stretchande delete-knapp vid enstaka listobjekt

## 10. Träning (Training)
- Teknikkatalog per sport
- SkillPractice-flöde med förifylld teknik in i Analyze

## 11. CSV-katalog + språkstöd
- Sporter och tekniker lagras i CSV-filer under `data/catalog/`
- Språkdata ligger i separata filer per språk (`sports.<lang>.csv`, `skill_texts.<lang>.csv`)
- Katalogen byggs till typed data i `src/generated/catalog.ts`
- Stöd för flera språk i tekniktexter (idag `sv` + `en`) med fallback till `sv`