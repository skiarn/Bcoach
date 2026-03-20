# 🔄 User Flow

## Flöde A – Snabbanalys (Home)
1. Användaren öppnar `/`
2. Väljer sport/teknik (valfritt) via SkillPicker
3. Laddar upp eller spelar in video
4. Navigeras till `/analyze`

## Flöde B – Träningssession
1. Går till `/training`
2. Väljer teknik
3. Går via `/practice/:skillName/:type`
4. Laddar upp/spelar in
5. Navigeras till `/analyze` med förifylld teknik

## Analyze (`/analyze`)
1. **Steg 1: Rita**
   - Spela upp video, rita former, justera shape-tidsfönster
   - Hjälptext/panel visas under videoinnehållet
2. **Steg 2: Feedback**
   - Välj feedbackpunkter + fritext
3. **Steg 3: Nästa steg**
   - Om teknik saknas: välj sport/teknik direkt i steget
   - Annars visas endast nästa-steg panel
4. **Steg 4: Spara**
   - `Spara lokalt`: uppdaterar bibliotekspost
   - `Exportera & Ladda ner`: bäddar in metadata i videofil + lägger till exporterad post

## History (`/history`)
### Mode: Videos
1. Välj teknik-tab i vänster selector
2. Välj video
3. Se video + overlay + feedback + nästa steg
4. Öppna i Analyze eller ta bort

### Mode: Insights (`/history?view=insights`)
1. Välj period: `7 dagar`, `30 dagar`, `Alla`
2. Läs trender:
   - Feedback over tid
   - Vanligaste feedbackpunkter
   - Teknikprogress

## Metadata/läsning av äldre video
1. Om en äldre bibliotekspost saknar metadata
2. Metadata extraheras från blob (om tillgänglig)
3. Posten uppdateras i IndexedDB