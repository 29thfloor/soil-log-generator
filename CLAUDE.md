# Soil Boring Log Generator

A web-based tool for creating soil boring log diagrams with USCS soil patterns.

**Live:** https://soil-log-generator.vercel.app

## Tech Stack

- Vanilla JavaScript (no framework, no build tools)
- Static HTML served via Python HTTP server or Vercel
- SVG rendering for diagrams

## Project Structure

```
/
├── index.html         # Main app HTML
├── boring-log.js      # BoringLog class - SVG rendering
├── form-editor.js     # FormEditor class - interactive form
├── csv-parser.js      # CSV import functionality
├── sample.csv         # Example CSV data
├── docs/
│   └── interactive-form-design.md  # Design decisions & implementation plan
└── examples/          # Example data files
```

## Running Locally

```bash
python3 -m http.server 8080
open http://localhost:8080
```

## Architecture

### BoringLog Class (`boring-log.js`)
Main rendering component. Creates SVG diagrams with:
- USCS soil pattern fills (15 standard + extended codes)
- SPT blow counts with N-value calculation
- Groundwater level indicator
- Well construction side panel
- Dynamic legend

### FormEditor Class (`form-editor.js`)
Interactive form with:
- Accordion sections (Boring Info, People, Layers, Samples, Groundwater, Well)
- Card-based editing for layers and samples
- Blur-triggered preview updates
- Inline validation with summary panel

### CSV Parser (`csv-parser.js`)
Imports boring log data from CSV spreadsheets.

## Data Schema

See README.md for full schema documentation. Key objects:
- `boring` - metadata (id, project, client, dates, location, etc.)
- `layers[]` - soil layers with USCS, depths, description
- `samples[]` - SPT samples with blows, recovery
- `groundwater` - depth and notes
- `well` - monitoring well construction details

## Current Work

See `docs/interactive-form-design.md` for the interactive form implementation plan and progress.
