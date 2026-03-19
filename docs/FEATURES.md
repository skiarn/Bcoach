# 🚀 Features

## 1. Video Upload & Recording
- Ladda upp video från enhet (mobil och desktop)
- Spela in video direkt via enhetens kamera (desktop webcam eller mobilkamera)
- Fullskärmsöverlägget visar live-kamerafeed med blinkande REC-indikator under inspelning
- Fallback-codec-detektering (vp9 → vp8 → webm → mp4) för bred enhetskompatibilitet

## 2. Teknikval (Skill Picker)
- På startsidan: välj sport (Beachvolley / Volleyboll) och specifik teknik innan uppladdning
- Vald teknik skickas vidare till analysvyn och kopplar automatiskt rätt feedback och Nästa steg
- Samma teknikval sker via Träning → SkillPractice-flödet

## 3. Video Player
- Play / Pause
- Uppspelningshastighet: 0.25x, 0.5x, 1x
- Scrubbing via seek-slider
- Korrekt varaktighetskalibrering med fallback till `seekable.end()` för inspelade videos
- Professionellt kontrollöverläggg (visas vid hover) inuti videobehållaren

## 3.1 Fokusflöde i Analyze (Wizard)
- Stegvis arbetsflöde med en sak i fokus åt gången
- Ordning: `Rita/Redigera` → `Feedback` → `Nästa steg` → `Spara analys`
- Tydlig stepper + `Föregående/Nästa`-navigation
- Ritläget låses till steg 1 för att minska kognitiv belastning i senare steg

## 4. Ritverktyg (Drawing Tools)
- Rita linjer och cirklar direkt över videon
- Tidsstämplade former: varje form tilldelas ett synlighetsfönster (`visibleFrom` / `visibleTo`)
- Former skalas proportionellt vid ändring av fönsterstorlek och fullskärm
- Tidslinjeeditor: justera start-/sluttid per form med sliders
- Former lagras med källdimensioner (`sourceWidth` / `sourceHeight`) för korrekt scaling

## 5. Fullskärm
- Containerfullskärm (wrapper-div) – ritlager och kontroller ingår i fullskärmsläget
- Stöds i både Analys- och Historik-vyn

## 6. Feedback Panel
- Teknikspecifik feedback baserad på vald Skill (`skill.advice`)
- Allmänna felpunkter som alltid visas (GENERAL_FEEDBACK)
- Klickbara checkboxar – valda punkter sparas med analysen
- Fritextfält för egna observationer

## 7. Nästa steg
- Varje teknik har 4 konkreta, handlingsbara Nästa steg (`skill.nextSteps`)
- Användaren bockar av vilka steg som är aktuella
- Valda Nästa steg sparas med analysen och visas i Historik
- Fritextfält för egna nästa steg

## 8. Spara analys
- Sparar video-URL, former, feedback, nästa steg, teknik och tidsstämpel i `localStorage`
- Nyckel: `beach-volley-analyses`

## 9. Historik
- Lista tidigare analyser med datum och videonamn
- Detaljvy: uppspelning med former överläggt (`ShapeOverlay`), teknikbadge, feedback och Nästa steg
- Egna professionella kontroller (play/pause/seek/speed/fullskärm) även i historikvy
- Redigera/analysera igen: öppna en sparad analys i `Analyze` och uppdatera den
- Ta bort analys: radera en sparad analys direkt från detaljvyn

## 9.1 Gamification och statistik i Historik
- Tidsfilter for dashboard: `7 dagar`, `30 dagar`, `Alla`
- Statistikkort och trenddiagram anpassas efter vald period
- KPI-kort: totala pass, pass senaste 7 dagar, feedback/pass, nästa steg/pass
- XP och Level-system med progressbar till nästa nivå
- Badge-system (upplåsta milstolpar för aktivitet, streak och analysdjup)
- Feedback över tid: trendvisualisering per dag
- Vanligaste feedbackpunkter: topplista över återkommande fokusområden
- Teknikprogress: antal pass, senaste tillfälle och feedback/pass per teknik

## 10. Träning (Training)
- Bläddra bland tekniker per sport
- Starta SkillPractice-session för en specifik teknik med instruktionsvideo och råd