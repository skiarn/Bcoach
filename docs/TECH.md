# ⚙️ Tech Stack

## Frontend
- **React 18** med **TypeScript** (strict)
- **Vite** – byggverktyg och dev-server
- **react-router-dom** – klient-side routing

## Routing
| Route | Komponent | Beskrivning |
|---|---|---|
| `/` | `Home` | Startsida med teknikväljare + upload |
| `/analyze` | `Analyze` | Videoanalys med ritverktyg och feedback |
| `/history` | `History` | Lista och detaljvy för sparade analyser |
| `/training` | `Training` | Teknikbibliotek per sport |
| `/practice/:skillName/:type` | `SkillPractice` | Teknikspecifik övningssession |

## State-hantering
- React hooks (`useState`, `useRef`, `useEffect`, `useCallback`)
- `useLocalStorage<T>` – custom hook i `src/hooks/useLocalStorage.ts`
- Routerstate (`location.state`) för att skicka valda `Skill`-objekt mellan sidor

## Persistens
- **localStorage** – nyckel `beach-volley-analyses`
- Datamodell per analys:
  ```ts
  interface VideoAnalysis {
    id: string
    videoUrl: string
    videoName: string
    shapes: Shape[]
    feedback: string[]
    nextSteps: string[]
    timestamp: number
    skillName?: string
    skillType?: 'beachvolley' | 'volleyboll'
  }
  ```

## Video
- **HTML5 `<video>`** med forward ref (`VideoPlayer.tsx`)
- `src`-attribut direkt (ingen `<source>`-child)
- **MediaRecorder API** för inspelning (`UploadButton.tsx`)
  - Codec-fallback: `vp9 → vp8 → webm → mp4`
- Varaktighetskalibrering: fallback till `video.seekable.end(0)`

## Ritverktyg
- **Canvas API** – två komponenter:
  - `DrawingCanvas` – interaktiv, hanterar musevents, ritar och lagrar former
  - `ShapeOverlay` – skrivskyddad, renderar former vid uppspelning
- `Shape`-interface:
  ```ts
  interface Shape {
    id: string
    type: 'line' | 'circle'
    startX: number; startY: number
    endX: number;   endY: number
    sourceWidth: number; sourceHeight: number  // dimensioner vid ritning
    visibleFrom: number; visibleTo: number     // sekunder i videon
  }
  ```
- Skalning: koordinater normaliseras mot `sourceWidth/Height` vid rendering
- Tidsfiltrering: `isShapeVisibleAtTime(shape, currentTime)`

## Fullskärm
- `containerRef.requestFullscreen()` på wrapper-div – överläggg inkluderas
- `fullscreenchange`-event driver `isFullscreen`-state och CSS-klass `.is-fullscreen`
- `ResizeObserver` uppdaterar canvas-dimensioner vid storleksändring

## Teknikdata
- `src/utils/skills.ts` – exporterar `Skill[]` med:
  - `name`, `type` (`beachvolley` | `volleyboll`)
  - `videoUrls: string[]`
  - `advice: string[]` – teknikspecifika råd
  - `nextSteps: string[]` – 4 konkreta träningsuppgifter per teknik
- Täcker ~10 tekniker per sport (totalt 20+)

## Backend (framtid)
- Firebase
  - Auth
  - Storage (videofiler)
  - Firestore (analyser och användardata)