# 🔄 User Flow

## Flöde A – Snabbanalys (från startsidan)

1. **Start** – Användaren öppnar appen (`/`)
2. **Teknikval (valfritt)** – Väljer sport (Beachvolley / Volleyboll) och en teknik via chip-grid
3. **Upload / Record** – Laddar upp en video **eller** spelar in direkt med kameran
	- Under inspelning: fullskärmsöverläggg med live-feed och `● REC`-indikator
4. **Analyze** – Navigerar automatiskt till `/analyze` (med vald teknik i routerstate om vald)
5. → *Se Analyssteg nedan*

---

## Flöde B – Träningssession (via Träning)

1. **Träning** – Navigerar till `/training`
2. **Välj teknik** – Klickar på ett teknik-kort (t.ex. Fingerslag)
3. **SkillPractice** – `/practice/:skillName/:type` visar instruktionsvideo och råd
4. **Upload / Record** – Laddar upp eller spelar in sin övning
5. **Analyze** – Navigerar till `/analyze` med den valda tekniken förifylld
6. → *Se Analyssteg nedan*

---

## Analyssteg (`/analyze`)

1. **Video laddas** – Visas i `.video-stage` med professionella kontroller (hover-overlay)
2. **Stegvis fokusflöde** – Användaren följer en wizard med tydliga `Föregående/Nästa`-knappar
3. **Steg 1: Rita/Redigera**
	- Rita linjer/cirklar på valfritt ögonblick
	- Varje form tilldelas automatiskt ett tidsfönster (±1 s kring ritögonblicket)
	- Tidslinjeeditor: justera `visibleFrom` / `visibleTo` per form med sliders
4. **Steg 2: Feedback**
	- Videoytan döljs för att hålla fokus på en uppgift i taget
	- Endast feedback-delen visas i panelen
	- Bocka av teknikspecifika och generella felpunkter, samt skriv egna observationer
5. **Steg 3: Nästa steg**
	- Videoytan är fortsatt dold
	- Endast Nästa steg-delen visas i panelen
	- Välj övningspunkter och lägg till egna nästa steg
6. **Steg 4: Spara analys**
	- En sammanfattning visas (feedbackpunkter och nästa steg)
	- Klicka `Spara analys` för att lagra allt i localStorage
7. **Efter sparning**
	- Välj direkt mellan `Se i historik` eller `Öva och spela in igen`
8. **Fullskärm** – Kan användas under analysen; former och kontroller följer med

---

## Historikflöde (`/history`)

1. **Historik Dashboard** – Överst visas statistik, level/XP, badges och feedbacktrend över tid
2. **Gruppad lista** – Sparade analyser visas per sport och teknik
3. **Detaljvy** – Klicka på en analys
	- Video spelas med `ShapeOverlay` som visar tidsstämplade former
	- Egna play/pause/seek/speed-kontroller och fullskärm
	- Teknikbadge, feedbacklista och Nästa steg visas under videon
4. **Redigera / Analysera igen** – Öppna analysen i Analyze-vyn, justera innehållet och spara uppdatering
5. **Ta bort** – Radera analysen från historiken via `Ta bort`-knappen
6. **Tillbaka** – Stäng detaljvy och återgå till listan