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
- Routerstate (`location.state`) för att skicka valda `Skill`-objekt mellan sidor
- Query params för History mode (`view=videos|insights`)

## Persistens
- **IndexedDB** (`bcoach-video-library`, store `videos`)
- Datamodell:
  ```ts
  interface VideoLibraryRecord {
    id: string
    name: string
    mimeType: string
    size: number
    createdAt: number
    source: 'imported' | 'exported'
    metadata?: EmbeddedAnalysisMetadata
    blob: Blob
  }
  ```
- Metadata-hydrering för äldre poster: extraktion från blob och `upsert`

## Video
- **HTML5 `<video>`** med forward ref (`VideoPlayer.tsx`)
- `src`-attribut direkt (ingen `<source>`-child)
- **MediaRecorder API** för inspelning (`UploadButton.tsx`)
  - Codec-fallback: `vp9 → vp8 → webm → mp4`
- Varaktighetskalibrering: fallback till `video.seekable.end(0)`

## FFmpeg metadata pipeline
- `@ffmpeg/ffmpeg` + `@ffmpeg/util`
- Core-filer hostas lokalt i `public/ffmpeg/`
- Core laddas via runtime blob URL i `ffmpegClient`
- Metadata embed/extract i `videoMetadata.ts`:
  - Write: `-metadata comment=bcoach:<base64-json>`
  - Read: `-f ffmetadata` + parse av `comment=`
- Vite config exkluderar ffmpeg-paket från dep optimizer för stabil dev/hmr

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

## History-arkitektur
- `History` använder två intent-vyer:
  - Videos
  - Insights
- Komponenter:
  - `HistorySkillGroups` (teknik-tabbar + videolista)
  - `HistoryDashboard` (insights)
  - `historyData.ts` (beräkningar: KPI, trend, topics, skill progress)

## Backend (framtid)
- Firebase
  - Auth
  - Storage (videofiler)
  - Firestore (analyser och användardata)