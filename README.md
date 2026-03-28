# Bcoach

🏐 **Beach Volley Analyzer** - AI-powered video analysis tool for beach volleyball players

Analyze your beach volleyball technique with AI assistance, get personalized feedback, and improve your game!

## Features

- 🎥 Video upload and analysis
- ✏️ Drawing tools for technique visualization
- 📊 Skill-specific feedback for beach volleyball techniques
- 🎯 Practice mode with instructional videos
- 💾 Save and track your progress

## Live Demo

🚀 **[Try it live on GitHub Pages](https://skiarn.github.io/Bcoach/)**

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/skiarn/Bcoach.git
cd Bcoach
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

## Deployment

This project is configured for automatic deployment to GitHub Pages on every push to the main branch.

## Technologies Used

- React 18
- TypeScript
- Vite
- React Router
- HTML5 Canvas for drawing tools

## Content Catalog (CSV)

Sports and skills are stored in CSV files under `data/catalog/`:

- `data/catalog/sports.csv` (language-neutral sport metadata)
- `data/catalog/sports.sv.csv`, `data/catalog/sports.en.csv` (sport labels per language)
- `data/catalog/skills.csv` (language-neutral skill metadata)
- `data/catalog/skill_texts.sv.csv`, `data/catalog/skill_texts.en.csv` (skill text per language)

A build step generates typed data for the app in `src/generated/catalog.ts` via:

```bash
npm run build:catalog
```

`npm run dev` and `npm run build` run this automatically.

## Localization

The catalog supports multiple locales (currently `sv` and `en`) with fallback to `sv`.

- Set language via query param: `?lang=en`
- Locale is persisted in browser storage (`bcoach.locale`)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
