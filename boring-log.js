/**
 * Boring Log SVG Renderer
 * Generates soil boring log diagrams with USCS-style patterns
 */

class BoringLog {
  constructor(container, options = {}) {
    this.container = container;
    this.data = null;

    // Default configuration
    this.config = {
      width: 700,
      headerHeight: 190,
      footerHeight: 40,
      legendHeight: 140,
      wellPanelWidth: 150,
      showLegend: true,
      depthScale: 20, // pixels per unit depth
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      // Base columns (always shown)
      baseColumns: {
        depth: { width: 40, label: 'Depth' },
        elevation: { width: 45, label: 'Elev.' },
        graphic: { width: 60, label: 'Soil' },
        uscs: { width: 45, label: 'USCS' },
        description: { width: 200, label: 'Description' },
        moisture: { width: 50, label: 'Moist.' },
        sample: { width: 50, label: 'Sample' },
        spt: { width: 70, label: 'SPT N' },
        recovery: { width: 45, label: 'Rec.' }
      },
      // Conditional columns (shown only when data exists)
      conditionalColumns: {
        odor: { width: 55, label: 'Odor' },
        pid: { width: 45, label: 'PID' }
      },
      // Moisture options for structured data
      moistureOptions: ['dry', 'moist', 'wet', 'saturated'],
      // Odor options
      odorOptions: ['none', 'petroleum', 'chlorinated', 'organic', 'other'],
      colors: {
        border: '#333',
        headerBg: '#f5f5f5',
        gridLine: '#ccc',
        groundwater: '#0066cc',
        text: '#333',
        wellCasing: '#666',
        wellScreen: '#999',
        wellSeal: '#8B4513',
        wellFilter: '#F4A460'
      },
      ...options
    };
  }

  setData(data) {
    this.data = data;
    this.render();
  }

  getData() {
    return this.data;
  }

  render() {
    if (!this.data) return;

    const { headerHeight, footerHeight, legendHeight, wellPanelWidth, showLegend, margins, depthScale, baseColumns, conditionalColumns } = this.config;
    const totalDepth = this.data.boring.totalDepth || 30;
    const graphicHeight = totalDepth * depthScale;
    const legendSpace = showLegend ? legendHeight : 0;

    // Determine which conditional columns to show
    this.activeColumns = { ...baseColumns };
    const hasOdorData = this.data.layers?.some(l => l.odor && l.odor !== 'none');
    const hasPidData = this.data.layers?.some(l => l.pid !== undefined && l.pid !== null);

    if (hasOdorData) {
      this.activeColumns.odor = conditionalColumns.odor;
    }
    if (hasPidData) {
      this.activeColumns.pid = conditionalColumns.pid;
    }

    // Calculate total columns width
    const columnsWidth = Object.values(this.activeColumns).reduce((sum, col) => sum + col.width, 0);

    // Check for well data
    const hasWellData = this.data.well && Object.keys(this.data.well).length > 0;
    const wellSpace = hasWellData ? wellPanelWidth + 10 : 0;

    // Calculate total width
    const width = columnsWidth + wellSpace + margins.left + margins.right;
    const height = headerHeight + graphicHeight + footerHeight + legendSpace + margins.top + margins.bottom;

    // Clear container
    this.container.innerHTML = '';

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.fontFamily = 'Arial, sans-serif';

    // Add pattern definitions
    const defs = this.createPatternDefs();
    svg.appendChild(defs);

    // Create main group with margins
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('transform', `translate(${margins.left}, ${margins.top})`);

    // Render components
    this.renderHeader(mainGroup, columnsWidth + wellSpace);
    this.renderColumnHeaders(mainGroup, headerHeight - 30);
    this.renderDepthScale(mainGroup, headerHeight, graphicHeight, totalDepth);
    this.renderSoilLayers(mainGroup, headerHeight, graphicHeight, totalDepth);
    this.renderSamples(mainGroup, headerHeight, totalDepth);
    this.renderGroundwater(mainGroup, headerHeight, totalDepth);

    // Render well construction panel if data exists
    if (hasWellData) {
      this.renderWellPanel(mainGroup, columnsWidth + 10, headerHeight, graphicHeight, totalDepth);
    }

    if (showLegend) {
      this.renderLegend(mainGroup, headerHeight + graphicHeight + footerHeight, columnsWidth + wellSpace);
    }
    this.renderBorder(mainGroup, columnsWidth + wellSpace, height - margins.top - margins.bottom);

    svg.appendChild(mainGroup);
    this.container.appendChild(svg);
  }

  createPatternDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // USCS Pattern definitions
    const patterns = {
      // Gravels - circles
      'GW': { type: 'gravel', fill: '#d4a574' },
      'GP': { type: 'gravel', fill: '#c9956a' },
      'GM': { type: 'gravel-silt', fill: '#bfae8e' },
      'GC': { type: 'gravel-clay', fill: '#a89070' },

      // Sands - dots
      'SW': { type: 'sand', fill: '#f4e4bc' },
      'SP': { type: 'sand', fill: '#edd9a8' },
      'SM': { type: 'sand-silt', fill: '#e6d5a8' },
      'SC': { type: 'sand-clay', fill: '#d9c494' },

      // Silts - horizontal lines
      'ML': { type: 'silt', fill: '#c4d4c4' },
      'MH': { type: 'silt', fill: '#a8c4a8' },

      // Clays - diagonal lines
      'CL': { type: 'clay', fill: '#8fbc8f' },
      'CH': { type: 'clay-heavy', fill: '#6b8e6b' },

      // Organics
      'OL': { type: 'organic', fill: '#8b7355' },
      'OH': { type: 'organic', fill: '#6b5344' },

      // Peat
      'PT': { type: 'peat', fill: '#4a3728' },

      // === Non-USCS / Extended Codes ===
      // Topsoil
      'TS': { type: 'topsoil', fill: '#5d4e37' },
      'TOPSOIL': { type: 'topsoil', fill: '#5d4e37' },

      // Fill material
      'FILL': { type: 'fill', fill: '#9e9e9e' },

      // Rock types
      'QUA': { type: 'rock', fill: '#d4d4d4' },  // Quartz
      'ARG': { type: 'rock', fill: '#b8a090' },  // Argillite
      'ROCK': { type: 'rock', fill: '#c0c0c0' },
      'BR': { type: 'rock', fill: '#a0a0a0' },   // Bedrock

      // Other common codes
      'ORGANICS': { type: 'organic', fill: '#6b5344' },
      'MK': { type: 'silt', fill: '#a8c4a8' },   // Micaceous silt

      // Default for unknown codes
      'DEFAULT': { type: 'default', fill: '#e0e0e0' }
    };

    // Store patterns for dynamic lookup
    this.knownPatterns = new Set(Object.keys(patterns));

    for (const [uscs, config] of Object.entries(patterns)) {
      const pattern = this.createUSCSPattern(uscs, config);
      defs.appendChild(pattern);
    }

    // Groundwater marker
    const gwMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    gwMarker.setAttribute('id', 'groundwater-triangle');
    gwMarker.setAttribute('viewBox', '0 0 10 10');
    gwMarker.setAttribute('refX', '5');
    gwMarker.setAttribute('refY', '10');
    gwMarker.setAttribute('markerWidth', '8');
    gwMarker.setAttribute('markerHeight', '8');
    gwMarker.setAttribute('orient', 'auto');

    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    triangle.setAttribute('d', 'M 0 10 L 5 0 L 10 10 Z');
    triangle.setAttribute('fill', this.config.colors.groundwater);
    gwMarker.appendChild(triangle);
    defs.appendChild(gwMarker);

    return defs;
  }

  createUSCSPattern(uscs, config) {
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', `pattern-${uscs}`);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '16');
    pattern.setAttribute('height', '16');

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '16');
    bg.setAttribute('height', '16');
    bg.setAttribute('fill', config.fill);
    pattern.appendChild(bg);

    // Pattern overlay based on type
    switch (config.type) {
      case 'gravel':
        this.addGravelPattern(pattern);
        break;
      case 'gravel-silt':
        this.addGravelPattern(pattern);
        this.addSiltLines(pattern);
        break;
      case 'gravel-clay':
        this.addGravelPattern(pattern);
        this.addClayLines(pattern);
        break;
      case 'sand':
        this.addSandDots(pattern);
        break;
      case 'sand-silt':
        this.addSandDots(pattern);
        this.addSiltLines(pattern);
        break;
      case 'sand-clay':
        this.addSandDots(pattern);
        this.addClayLines(pattern);
        break;
      case 'silt':
        this.addSiltLines(pattern);
        break;
      case 'clay':
        this.addClayLines(pattern);
        break;
      case 'clay-heavy':
        this.addClayLines(pattern, true);
        break;
      case 'organic':
        this.addOrganicPattern(pattern);
        break;
      case 'peat':
        this.addPeatPattern(pattern);
        break;
      case 'topsoil':
        this.addTopsoilPattern(pattern);
        break;
      case 'fill':
        this.addFillPattern(pattern);
        break;
      case 'rock':
        this.addRockPattern(pattern);
        break;
      case 'default':
        this.addDefaultPattern(pattern);
        break;
    }

    return pattern;
  }

  addGravelPattern(pattern) {
    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '4');
    circle1.setAttribute('cy', '4');
    circle1.setAttribute('r', '3');
    circle1.setAttribute('fill', 'none');
    circle1.setAttribute('stroke', '#333');
    circle1.setAttribute('stroke-width', '1');
    pattern.appendChild(circle1);

    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle2.setAttribute('cx', '12');
    circle2.setAttribute('cy', '12');
    circle2.setAttribute('r', '3');
    circle2.setAttribute('fill', 'none');
    circle2.setAttribute('stroke', '#333');
    circle2.setAttribute('stroke-width', '1');
    pattern.appendChild(circle2);
  }

  addSandDots(pattern) {
    const dots = [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]];
    dots.forEach(([cx, cy]) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', '1');
      dot.setAttribute('fill', '#333');
      pattern.appendChild(dot);
    });
  }

  addSiltLines(pattern) {
    for (let y = 4; y <= 12; y += 8) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y);
      line.setAttribute('x2', '16');
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '0.5');
      pattern.appendChild(line);
    }
  }

  addClayLines(pattern, heavy = false) {
    const spacing = heavy ? 4 : 8;
    for (let i = -16; i <= 32; i += spacing) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i);
      line.setAttribute('y1', '0');
      line.setAttribute('x2', i + 16);
      line.setAttribute('y2', '16');
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '0.5');
      pattern.appendChild(line);
    }
  }

  addOrganicPattern(pattern) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M2,8 Q8,2 14,8 Q8,14 2,8');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#222');
    path.setAttribute('stroke-width', '0.5');
    pattern.appendChild(path);
  }

  addPeatPattern(pattern) {
    // Grass-like vertical lines
    for (let x = 2; x <= 14; x += 4) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', '16');
      line.setAttribute('x2', x);
      line.setAttribute('y2', '4');
      line.setAttribute('stroke', '#1a1a1a');
      line.setAttribute('stroke-width', '1');
      pattern.appendChild(line);
    }
  }

  addTopsoilPattern(pattern) {
    // Root-like organic pattern with dots
    const dots = [[3, 5], [8, 3], [13, 6], [5, 11], [10, 13]];
    dots.forEach(([cx, cy]) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', '1.5');
      dot.setAttribute('fill', '#3d3225');
      pattern.appendChild(dot);
    });
    // Wavy line for organic material
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,8 Q4,6 8,8 Q12,10 16,8');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#3d3225');
    path.setAttribute('stroke-width', '0.5');
    pattern.appendChild(path);
  }

  addFillPattern(pattern) {
    // Random angular shapes to represent mixed fill material
    const shapes = [
      'M2,2 L5,2 L4,5 Z',
      'M10,3 L14,4 L12,7 L9,6 Z',
      'M3,10 L7,9 L6,13 L2,12 Z',
      'M11,11 L14,10 L15,14 L11,14 Z'
    ];
    shapes.forEach(d => {
      const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', d);
      shape.setAttribute('fill', 'none');
      shape.setAttribute('stroke', '#555');
      shape.setAttribute('stroke-width', '0.5');
      pattern.appendChild(shape);
    });
  }

  addRockPattern(pattern) {
    // Brick-like pattern for rock
    for (let y = 0; y <= 16; y += 8) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y);
      line.setAttribute('x2', '16');
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', '0.5');
      pattern.appendChild(line);
    }
    // Vertical lines offset
    const vLines = [[8, 0, 8], [0, 8, 8], [16, 8, 8]];
    vLines.forEach(([x, y1, h]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y1 + h);
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', '0.5');
      pattern.appendChild(line);
    });
  }

  addDefaultPattern(pattern) {
    // Simple cross-hatch for unknown soil types
    for (let i = 0; i <= 16; i += 8) {
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', i);
      line1.setAttribute('y1', '0');
      line1.setAttribute('x2', i);
      line1.setAttribute('y2', '16');
      line1.setAttribute('stroke', '#999');
      line1.setAttribute('stroke-width', '0.3');
      pattern.appendChild(line1);

      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '0');
      line2.setAttribute('y1', i);
      line2.setAttribute('x2', '16');
      line2.setAttribute('y2', i);
      line2.setAttribute('stroke', '#999');
      line2.setAttribute('stroke-width', '0.3');
      pattern.appendChild(line2);
    }
  }

  renderHeader(parent, width) {
    const { boring, groundwater } = this.data;
    const { colors, headerHeight } = this.config;
    const headerContentHeight = headerHeight - 30; // Leave room for column headers

    // Header background
    const headerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerBg.setAttribute('x', '0');
    headerBg.setAttribute('y', '0');
    headerBg.setAttribute('width', width);
    headerBg.setAttribute('height', headerContentHeight);
    headerBg.setAttribute('fill', colors.headerBg);
    headerBg.setAttribute('stroke', colors.border);
    parent.appendChild(headerBg);

    // Divide header into 3 columns
    const col1X = 10;
    const col2X = width / 3;
    const col3X = (width / 3) * 2;
    const lineHeight = 13;
    let y = 16;

    // === Column 1: Project & Site Info ===
    const title = this.createText(`BORING LOG: ${boring.id}`, col1X, y, { fontWeight: 'bold', fontSize: '13px' });
    parent.appendChild(title);
    y += lineHeight + 2;

    const project = this.createText(`Project: ${boring.project}`, col1X, y, { fontSize: '10px' });
    parent.appendChild(project);
    y += lineHeight;

    if (boring.client) {
      const client = this.createText(`Client: ${boring.client}`, col1X, y, { fontSize: '10px' });
      parent.appendChild(client);
      y += lineHeight;
    }

    if (boring.location) {
      const locText = `Location: ${boring.location.coords.join(', ')} (${boring.location.system})`;
      const location = this.createText(locText, col1X, y, { fontSize: '9px' });
      parent.appendChild(location);
      y += lineHeight;
    }

    if (boring.elevation !== undefined) {
      const elevation = this.createText(`Surface Elev: ${boring.elevation} ft`, col1X, y, { fontSize: '10px' });
      parent.appendChild(elevation);
      y += lineHeight;
    }

    const totalDepthText = this.createText(`Total Depth: ${boring.totalDepth} ft`, col1X, y, { fontSize: '10px' });
    parent.appendChild(totalDepthText);

    if (groundwater && groundwater.depth !== undefined) {
      y += lineHeight;
      const gwText = `GW Depth: ${groundwater.depth} ft${groundwater.note ? ` (${groundwater.note})` : ''}`;
      const gw = this.createText(gwText, col1X, y, { fontSize: '10px', fill: colors.groundwater });
      parent.appendChild(gw);
    }

    // === Column 2: Consultant & Drilling Info ===
    y = 16;
    if (boring.consultant) {
      const consultantLabel = this.createText('CONSULTANT', col2X, y, { fontWeight: 'bold', fontSize: '10px' });
      parent.appendChild(consultantLabel);
      y += lineHeight;

      if (boring.consultant.company) {
        const company = this.createText(boring.consultant.company, col2X, y, { fontSize: '10px' });
        parent.appendChild(company);
        y += lineHeight;
      }
      if (boring.consultant.contact) {
        const contact = this.createText(boring.consultant.contact, col2X, y, { fontSize: '10px' });
        parent.appendChild(contact);
        y += lineHeight;
      }
      if (boring.consultant.phone) {
        const phone = this.createText(boring.consultant.phone, col2X, y, { fontSize: '10px' });
        parent.appendChild(phone);
        y += lineHeight;
      }
    }

    // Drilling info below consultant
    y += 4;
    if (boring.drillingMethod) {
      const method = this.createText(`Method: ${boring.drillingMethod}`, col2X, y, { fontSize: '9px' });
      parent.appendChild(method);
      y += lineHeight;
    }
    if (boring.equipment) {
      const equip = this.createText(`Equipment: ${boring.equipment}`, col2X, y, { fontSize: '9px' });
      parent.appendChild(equip);
      y += lineHeight;
    }
    if (boring.loggedBy) {
      const logged = this.createText(`Logged By: ${boring.loggedBy}`, col2X, y, { fontSize: '9px' });
      parent.appendChild(logged);
    }

    // === Column 3: Driller & Date Info ===
    y = 16;
    const drillerLabel = this.createText('DRILLER', col3X, y, { fontWeight: 'bold', fontSize: '10px' });
    parent.appendChild(drillerLabel);
    y += lineHeight;

    // Handle both old string format and new object format for driller
    if (typeof boring.driller === 'object') {
      if (boring.driller.company) {
        const drillerCo = this.createText(boring.driller.company, col3X, y, { fontSize: '10px' });
        parent.appendChild(drillerCo);
        y += lineHeight;
      }
      if (boring.driller.name) {
        const drillerName = this.createText(boring.driller.name, col3X, y, { fontSize: '10px' });
        parent.appendChild(drillerName);
        y += lineHeight;
      }
      if (boring.driller.license) {
        const license = this.createText(`License: ${boring.driller.license}`, col3X, y, { fontSize: '9px' });
        parent.appendChild(license);
        y += lineHeight;
      }
    } else if (boring.driller) {
      const drillerText = this.createText(boring.driller, col3X, y, { fontSize: '10px' });
      parent.appendChild(drillerText);
      y += lineHeight;
    }

    y += 4;
    // Support both single date and start/complete dates
    if (boring.dateStart && boring.dateComplete) {
      const startDate = this.createText(`Start: ${boring.dateStart}`, col3X, y, { fontSize: '10px' });
      parent.appendChild(startDate);
      y += lineHeight;
      const completeDate = this.createText(`Complete: ${boring.dateComplete}`, col3X, y, { fontSize: '10px' });
      parent.appendChild(completeDate);
    } else {
      const dateText = boring.time ? `${boring.date} ${boring.time}` : boring.date;
      const date = this.createText(`Date: ${dateText}`, col3X, y, { fontSize: '10px' });
      parent.appendChild(date);
    }

    if (boring.weather) {
      y += lineHeight;
      const weather = this.createText(`Weather: ${boring.weather}`, col3X, y, { fontSize: '10px' });
      parent.appendChild(weather);
    }
  }

  renderColumnHeaders(parent, y) {
    const { colors } = this.config;
    const columns = this.activeColumns;
    let x = 0;

    // Header row background
    const headerRow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerRow.setAttribute('x', '0');
    headerRow.setAttribute('y', y);
    headerRow.setAttribute('width', Object.values(columns).reduce((sum, col) => sum + col.width, 0));
    headerRow.setAttribute('height', '30');
    headerRow.setAttribute('fill', '#e8e8e8');
    headerRow.setAttribute('stroke', colors.border);
    parent.appendChild(headerRow);

    for (const [key, col] of Object.entries(columns)) {
      // Column separator
      const sep = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      sep.setAttribute('x1', x);
      sep.setAttribute('y1', y);
      sep.setAttribute('x2', x);
      sep.setAttribute('y2', y + 30);
      sep.setAttribute('stroke', colors.border);
      parent.appendChild(sep);

      // Column label
      const label = this.createText(col.label, x + col.width / 2, y + 20, {
        fontSize: '9px',
        fontWeight: 'bold',
        textAnchor: 'middle'
      });
      parent.appendChild(label);

      x += col.width;
    }
  }

  renderDepthScale(parent, startY, height, totalDepth) {
    const { colors, depthScale } = this.config;
    const columns = this.activeColumns;
    const depthColWidth = columns.depth.width;
    const elevColWidth = columns.elevation.width;
    const surfaceElevation = this.data.boring.elevation;

    // Depth column background
    const depthBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    depthBg.setAttribute('x', '0');
    depthBg.setAttribute('y', startY);
    depthBg.setAttribute('width', depthColWidth);
    depthBg.setAttribute('height', height);
    depthBg.setAttribute('fill', 'white');
    depthBg.setAttribute('stroke', colors.border);
    parent.appendChild(depthBg);

    // Elevation column background
    const elevBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    elevBg.setAttribute('x', depthColWidth);
    elevBg.setAttribute('y', startY);
    elevBg.setAttribute('width', elevColWidth);
    elevBg.setAttribute('height', height);
    elevBg.setAttribute('fill', 'white');
    elevBg.setAttribute('stroke', colors.border);
    parent.appendChild(elevBg);

    // Depth and elevation markers
    const interval = totalDepth <= 20 ? 2 : 5;
    for (let d = 0; d <= totalDepth; d += interval) {
      const y = startY + d * depthScale;

      // Tick mark for depth
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', depthColWidth - 10);
      tick.setAttribute('y1', y);
      tick.setAttribute('x2', depthColWidth);
      tick.setAttribute('y2', y);
      tick.setAttribute('stroke', colors.border);
      parent.appendChild(tick);

      // Depth label
      const depthLabel = this.createText(d.toString(), depthColWidth - 15, y + 4, {
        fontSize: '9px',
        textAnchor: 'end'
      });
      parent.appendChild(depthLabel);

      // Elevation label (if surface elevation is known)
      if (surfaceElevation !== undefined) {
        const elev = (surfaceElevation - d).toFixed(1);
        const elevLabel = this.createText(elev, depthColWidth + elevColWidth / 2, y + 4, {
          fontSize: '8px',
          textAnchor: 'middle'
        });
        parent.appendChild(elevLabel);
      }

      // Grid line across all columns
      if (d > 0 && d < totalDepth) {
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', depthColWidth + elevColWidth);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', Object.values(columns).reduce((sum, col) => sum + col.width, 0));
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', colors.gridLine);
        gridLine.setAttribute('stroke-dasharray', '2,2');
        parent.appendChild(gridLine);
      }
    }
  }

  renderSoilLayers(parent, startY, height, totalDepth) {
    const { colors, depthScale } = this.config;
    const columns = this.activeColumns;
    const { layers } = this.data;

    // Calculate column positions dynamically
    const colPositions = {};
    let x = 0;
    for (const [key, col] of Object.entries(columns)) {
      colPositions[key] = { x, width: col.width };
      x += col.width;
    }

    for (const layer of layers) {
      const y1 = startY + layer.depthTop * depthScale;
      const y2 = startY + layer.depthBottom * depthScale;
      const layerHeight = y2 - y1;
      const centerY = y1 + layerHeight / 2 + 4;

      // Soil graphic pattern
      const patternId = this.getPatternId(layer.uscs);
      const graphic = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      graphic.setAttribute('x', colPositions.graphic.x);
      graphic.setAttribute('y', y1);
      graphic.setAttribute('width', colPositions.graphic.width);
      graphic.setAttribute('height', layerHeight);
      graphic.setAttribute('fill', `url(#${patternId})`);
      graphic.setAttribute('stroke', colors.border);
      parent.appendChild(graphic);

      // USCS label
      const uscsLabel = this.createText(layer.uscs, colPositions.uscs.x + colPositions.uscs.width / 2, centerY, {
        fontSize: '9px',
        fontWeight: 'bold',
        textAnchor: 'middle'
      });
      parent.appendChild(uscsLabel);

      // Description (with text wrapping)
      this.renderWrappedText(parent, layer.description, colPositions.description.x + 3, y1 + 12, colPositions.description.width - 6, layerHeight - 8);

      // Moisture
      if (layer.moisture && colPositions.moisture) {
        const moistLabel = this.createText(layer.moisture, colPositions.moisture.x + colPositions.moisture.width / 2, centerY, {
          fontSize: '8px',
          textAnchor: 'middle'
        });
        parent.appendChild(moistLabel);
      }

      // Odor (conditional column)
      if (layer.odor && colPositions.odor) {
        const odorText = layer.odor === 'petroleum' ? 'petrol.' :
                         layer.odor === 'chlorinated' ? 'chlor.' :
                         layer.odor === 'organic' ? 'org.' : layer.odor;
        const odorLabel = this.createText(odorText, colPositions.odor.x + colPositions.odor.width / 2, centerY, {
          fontSize: '8px',
          textAnchor: 'middle',
          fill: layer.odor !== 'none' ? '#c00' : colors.text
        });
        parent.appendChild(odorLabel);
      }

      // PID (conditional column)
      if (layer.pid !== undefined && colPositions.pid) {
        const pidLabel = this.createText(layer.pid.toFixed(1), colPositions.pid.x + colPositions.pid.width / 2, centerY, {
          fontSize: '8px',
          textAnchor: 'middle',
          fill: layer.pid > 50 ? '#c00' : colors.text
        });
        parent.appendChild(pidLabel);
      }

      // Layer boundary line
      if (layer.depthTop > 0) {
        const boundary = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        boundary.setAttribute('x1', colPositions.graphic.x);
        boundary.setAttribute('y1', y1);
        boundary.setAttribute('x2', colPositions.description.x + colPositions.description.width);
        boundary.setAttribute('y2', y1);
        boundary.setAttribute('stroke', colors.border);
        boundary.setAttribute('stroke-width', '1.5');
        parent.appendChild(boundary);
      }
    }

    // Column backgrounds (for columns after description)
    const bgColumns = ['uscs', 'moisture', 'odor', 'pid', 'sample', 'spt', 'recovery'];
    bgColumns.forEach(colName => {
      if (colPositions[colName]) {
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', colPositions[colName].x);
        bg.setAttribute('y', startY);
        bg.setAttribute('width', colPositions[colName].width);
        bg.setAttribute('height', height);
        bg.setAttribute('fill', 'white');
        bg.setAttribute('stroke', colors.border);
        parent.appendChild(bg);
      }
    });
  }

  renderSamples(parent, startY, totalDepth) {
    const { colors, depthScale } = this.config;
    const columns = this.activeColumns;
    const { samples } = this.data;

    if (!samples) return;

    // Calculate column positions dynamically
    const colPositions = {};
    let x = 0;
    for (const [key, col] of Object.entries(columns)) {
      colPositions[key] = { x, width: col.width };
      x += col.width;
    }

    const sampleX = colPositions.sample.x;
    const sptX = colPositions.spt.x;
    const recoveryX = colPositions.recovery.x;

    for (const sample of samples) {
      // Support both single depth and depth range
      const hasRange = sample.depthTop !== undefined && sample.depthBottom !== undefined;
      const depthTop = hasRange ? sample.depthTop : sample.depth;
      const depthBottom = hasRange ? sample.depthBottom : sample.depth;
      const centerDepth = hasRange ? (depthTop + depthBottom) / 2 : sample.depth;
      const y = startY + centerDepth * depthScale;

      // Sample marker and ID
      const markerHeight = hasRange ? Math.max(16, (depthBottom - depthTop) * depthScale) : 16;
      const markerY = hasRange ? startY + depthTop * depthScale : y - 8;

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      marker.setAttribute('x', sampleX + 3);
      marker.setAttribute('y', markerY);
      marker.setAttribute('width', colPositions.sample.width - 6);
      marker.setAttribute('height', markerHeight);
      marker.setAttribute('fill', sample.type === 'SPT' ? '#fff3cd' : '#d4edda');
      marker.setAttribute('stroke', colors.border);
      marker.setAttribute('rx', '2');
      parent.appendChild(marker);

      // Sample ID with optional depth range
      let idText = sample.id;
      if (hasRange) {
        idText = `${sample.id}\n(${depthTop}-${depthBottom})`;
      }

      // For range display, show ID and range on separate lines
      if (hasRange) {
        const idLabel = this.createText(sample.id, sampleX + colPositions.sample.width / 2, markerY + markerHeight / 2 - 3, {
          fontSize: '7px',
          textAnchor: 'middle'
        });
        parent.appendChild(idLabel);

        const rangeLabel = this.createText(`(${depthTop}-${depthBottom})`, sampleX + colPositions.sample.width / 2, markerY + markerHeight / 2 + 7, {
          fontSize: '6px',
          textAnchor: 'middle',
          fill: '#666'
        });
        parent.appendChild(rangeLabel);
      } else {
        const idLabel = this.createText(sample.id, sampleX + colPositions.sample.width / 2, y + 4, {
          fontSize: '7px',
          textAnchor: 'middle'
        });
        parent.appendChild(idLabel);
      }

      // SPT N-value
      if (sample.blows && sample.blows.length === 3) {
        const nValue = sample.blows[1] + sample.blows[2];
        const blowsText = sample.blows.join('-');

        const nLabel = this.createText(`N=${nValue}`, sptX + colPositions.spt.width / 2, y - 2, {
          fontSize: '9px',
          fontWeight: 'bold',
          textAnchor: 'middle'
        });
        parent.appendChild(nLabel);

        const blowsLabel = this.createText(`(${blowsText})`, sptX + colPositions.spt.width / 2, y + 9, {
          fontSize: '7px',
          textAnchor: 'middle',
          fill: '#666'
        });
        parent.appendChild(blowsLabel);
      }

      // Recovery
      if (sample.recovery !== undefined) {
        const recLabel = this.createText(sample.recovery.toString(), recoveryX + colPositions.recovery.width / 2, y + 4, {
          fontSize: '9px',
          textAnchor: 'middle'
        });
        parent.appendChild(recLabel);
      }

      // Depth indicator line (at center of sample)
      const depthLineY = hasRange ? startY + depthTop * depthScale : y;
      const depthLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      depthLine.setAttribute('x1', colPositions.depth.width + colPositions.elevation.width);
      depthLine.setAttribute('y1', depthLineY);
      depthLine.setAttribute('x2', sampleX);
      depthLine.setAttribute('y2', depthLineY);
      depthLine.setAttribute('stroke', '#999');
      depthLine.setAttribute('stroke-dasharray', '1,2');
      parent.appendChild(depthLine);
    }
  }

  renderGroundwater(parent, startY, totalDepth) {
    const { groundwater } = this.data;
    if (!groundwater || groundwater.depth === undefined) return;

    const { colors, depthScale } = this.config;
    const columns = this.activeColumns;
    const y = startY + groundwater.depth * depthScale;
    const graphicX = columns.depth.width;

    // Triangle marker on left side of graphic column
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const size = 8;
    triangle.setAttribute('points', `${graphicX},${y} ${graphicX - size},${y - size} ${graphicX - size},${y + size}`);
    triangle.setAttribute('fill', colors.groundwater);
    parent.appendChild(triangle);

    // Wavy line across graphic column
    const waveWidth = columns.graphic.width;
    let wavePath = `M ${graphicX} ${y}`;
    for (let x = 0; x < waveWidth; x += 10) {
      wavePath += ` q 5,-3 10,0`;
    }
    const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wave.setAttribute('d', wavePath);
    wave.setAttribute('fill', 'none');
    wave.setAttribute('stroke', colors.groundwater);
    wave.setAttribute('stroke-width', '2');
    parent.appendChild(wave);
  }

  renderBorder(parent, width, height) {
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', '0');
    border.setAttribute('y', '0');
    border.setAttribute('width', width);
    border.setAttribute('height', height);
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', this.config.colors.border);
    border.setAttribute('stroke-width', '2');
    parent.appendChild(border);
  }

  renderWellPanel(parent, startX, startY, height, totalDepth) {
    const { colors, wellPanelWidth, depthScale } = this.config;
    const { well, boring } = this.data;

    // Panel background
    const panelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    panelBg.setAttribute('x', startX);
    panelBg.setAttribute('y', startY);
    panelBg.setAttribute('width', wellPanelWidth);
    panelBg.setAttribute('height', height);
    panelBg.setAttribute('fill', '#fafafa');
    panelBg.setAttribute('stroke', colors.border);
    parent.appendChild(panelBg);

    // Panel title
    const title = this.createText('WELL CONSTRUCTION', startX + wellPanelWidth / 2, startY + 15, {
      fontSize: '9px',
      fontWeight: 'bold',
      textAnchor: 'middle'
    });
    parent.appendChild(title);

    // Well diagram area
    const diagramX = startX + 20;
    const diagramWidth = 40;
    const diagramTop = startY + 25;
    const diagramHeight = height - 50;

    // Calculate positions based on depths
    const getY = (depth) => diagramTop + (depth / totalDepth) * diagramHeight;

    // Draw borehole
    const borehole = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borehole.setAttribute('x', diagramX);
    borehole.setAttribute('y', diagramTop);
    borehole.setAttribute('width', diagramWidth);
    borehole.setAttribute('height', diagramHeight);
    borehole.setAttribute('fill', '#f0f0f0');
    borehole.setAttribute('stroke', colors.border);
    parent.appendChild(borehole);

    // Seal (bentonite) - from top to screen top
    if (well.sealTop !== undefined && well.sealBottom !== undefined) {
      const sealY1 = getY(well.sealTop);
      const sealY2 = getY(well.sealBottom);
      const seal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      seal.setAttribute('x', diagramX + 5);
      seal.setAttribute('y', sealY1);
      seal.setAttribute('width', diagramWidth - 10);
      seal.setAttribute('height', sealY2 - sealY1);
      seal.setAttribute('fill', colors.wellSeal);
      seal.setAttribute('stroke', colors.border);
      parent.appendChild(seal);

      // Seal label
      const sealLabel = this.createText('Seal', startX + wellPanelWidth - 5, (sealY1 + sealY2) / 2 + 4, {
        fontSize: '7px',
        textAnchor: 'end'
      });
      parent.appendChild(sealLabel);
    }

    // Filter pack - around screen
    if (well.screenTop !== undefined && well.screenBottom !== undefined) {
      const filterY1 = getY(well.screenTop);
      const filterY2 = getY(well.screenBottom);

      // Filter pack
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      filter.setAttribute('x', diagramX + 5);
      filter.setAttribute('y', filterY1);
      filter.setAttribute('width', diagramWidth - 10);
      filter.setAttribute('height', filterY2 - filterY1);
      filter.setAttribute('fill', colors.wellFilter);
      filter.setAttribute('stroke', colors.border);
      parent.appendChild(filter);

      // Screen (inside filter pack)
      const screenWidth = 16;
      const screen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      screen.setAttribute('x', diagramX + (diagramWidth - screenWidth) / 2);
      screen.setAttribute('y', filterY1);
      screen.setAttribute('width', screenWidth);
      screen.setAttribute('height', filterY2 - filterY1);
      screen.setAttribute('fill', 'white');
      screen.setAttribute('stroke', colors.wellScreen);
      screen.setAttribute('stroke-dasharray', '3,2');
      parent.appendChild(screen);

      // Screen label
      const screenLabel = this.createText('Screen', startX + wellPanelWidth - 5, (filterY1 + filterY2) / 2 + 4, {
        fontSize: '7px',
        textAnchor: 'end'
      });
      parent.appendChild(screenLabel);
    }

    // Casing (from top to screen)
    const casingWidth = 16;
    const casingTop = diagramTop;
    const casingBottom = well.screenTop !== undefined ? getY(well.screenTop) : diagramTop + diagramHeight * 0.5;

    const casingLeft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    casingLeft.setAttribute('x1', diagramX + (diagramWidth - casingWidth) / 2);
    casingLeft.setAttribute('y1', casingTop);
    casingLeft.setAttribute('x2', diagramX + (diagramWidth - casingWidth) / 2);
    casingLeft.setAttribute('y2', casingBottom);
    casingLeft.setAttribute('stroke', colors.wellCasing);
    casingLeft.setAttribute('stroke-width', '2');
    parent.appendChild(casingLeft);

    const casingRight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    casingRight.setAttribute('x1', diagramX + (diagramWidth + casingWidth) / 2);
    casingRight.setAttribute('y1', casingTop);
    casingRight.setAttribute('x2', diagramX + (diagramWidth + casingWidth) / 2);
    casingRight.setAttribute('y2', casingBottom);
    casingRight.setAttribute('stroke', colors.wellCasing);
    casingRight.setAttribute('stroke-width', '2');
    parent.appendChild(casingRight);

    // Well details text
    const detailsY = startY + height - 20;
    let detailLine = 0;

    if (well.casingDiameter) {
      const casingText = this.createText(`Casing: ${well.casingDiameter}" ${well.casingMaterial || ''}`, startX + 5, detailsY - (detailLine * 10), {
        fontSize: '7px'
      });
      parent.appendChild(casingText);
      detailLine++;
    }

    if (well.screenSlotSize) {
      const slotText = this.createText(`Slot: ${well.screenSlotSize}"`, startX + 5, detailsY - (detailLine * 10), {
        fontSize: '7px'
      });
      parent.appendChild(slotText);
    }
  }

  renderLegend(parent, startY, width) {
    const { colors } = this.config;
    const { layers, groundwater } = this.data;

    // USCS and extended soil descriptions
    const allDescriptions = {
      // Standard USCS codes
      'GW': 'Well-graded gravel',
      'GP': 'Poorly graded gravel',
      'GM': 'Silty gravel',
      'GC': 'Clayey gravel',
      'SW': 'Well-graded sand',
      'SP': 'Poorly graded sand',
      'SM': 'Silty sand',
      'SC': 'Clayey sand',
      'ML': 'Silt (low plasticity)',
      'MH': 'Silt (high plasticity)',
      'CL': 'Clay (low plasticity)',
      'CH': 'Clay (high plasticity)',
      'OL': 'Organic silt',
      'OH': 'Organic clay',
      'PT': 'Peat',
      // Extended / Non-USCS codes
      'TS': 'Topsoil',
      'TOPSOIL': 'Topsoil',
      'FILL': 'Fill material',
      'QUA': 'Quartz',
      'ARG': 'Argillite',
      'ROCK': 'Rock',
      'BR': 'Bedrock',
      'ORGANICS': 'Organic material',
      'MK': 'Micaceous silt'
    };

    // Get unique USCS codes used in this diagram
    const usedCodes = new Set();
    if (layers) {
      layers.forEach(layer => {
        // Handle dual classifications like "GP-GM" - add both parts
        const parts = layer.uscs.toUpperCase().split('-');
        parts.forEach(code => usedCodes.add(code));
      });
    }

    // Build legend entries - include unknown codes with their code as description
    const entries = [];
    usedCodes.forEach(code => {
      const description = allDescriptions[code] || code; // Use code as description if unknown
      entries.push([code, description]);
    });
    // Sort entries by code
    entries.sort((a, b) => a[0].localeCompare(b[0]));

    // Calculate dynamic legend height
    const hasGroundwater = groundwater && groundwater.depth !== undefined;
    const hasSamples = this.data.samples && this.data.samples.length > 0;
    const rowHeight = 22;
    const columns = Math.min(entries.length, 4);
    const rows = Math.ceil(entries.length / columns);
    const symbolsRowHeight = (hasSamples || hasGroundwater) ? 28 : 0;
    const contentHeight = rows * rowHeight + symbolsRowHeight;
    const dynamicLegendHeight = 40 + contentHeight;

    // Legend background
    const legendBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    legendBg.setAttribute('x', '0');
    legendBg.setAttribute('y', startY);
    legendBg.setAttribute('width', width);
    legendBg.setAttribute('height', dynamicLegendHeight);
    legendBg.setAttribute('fill', '#fafafa');
    legendBg.setAttribute('stroke', colors.border);
    parent.appendChild(legendBg);

    // Legend title
    const title = this.createText('LEGEND', 10, startY + 18, {
      fontSize: '11px',
      fontWeight: 'bold'
    });
    parent.appendChild(title);

    // Arrange in columns
    const colWidth = (width - 20) / columns;
    const swatchSize = 16;
    const startX = 10;
    const contentStartY = startY + 35;

    entries.forEach(([code, description], index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * colWidth;
      const y = contentStartY + row * rowHeight;

      // Pattern swatch
      const swatch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      swatch.setAttribute('x', x);
      swatch.setAttribute('y', y);
      swatch.setAttribute('width', swatchSize);
      swatch.setAttribute('height', swatchSize);
      swatch.setAttribute('fill', `url(#pattern-${code})`);
      swatch.setAttribute('stroke', colors.border);
      swatch.setAttribute('stroke-width', '0.5');
      parent.appendChild(swatch);

      // Code label
      const codeLabel = this.createText(code, x + swatchSize + 5, y + 12, {
        fontSize: '9px',
        fontWeight: 'bold'
      });
      parent.appendChild(codeLabel);

      // Description
      const descLabel = this.createText(description, x + swatchSize + 28, y + 12, {
        fontSize: '8px',
        fill: '#555'
      });
      parent.appendChild(descLabel);
    });

    // Sample types and groundwater on a separate row
    const symbolsY = contentStartY + rows * rowHeight + 8;
    let symbolX = startX;

    // Sample type descriptions
    const sampleTypeDescriptions = {
      'SPT': 'Standard Penetration Test',
      'SHELBY': 'Shelby Tube Sample',
      'GRAB': 'Grab Sample',
      'CORE': 'Core Sample',
      'AUGER': 'Auger Sample'
    };

    // Get unique sample types used
    const usedSampleTypes = new Set();
    if (this.data.samples) {
      this.data.samples.forEach(sample => {
        usedSampleTypes.add(sample.type.toUpperCase());
      });
    }

    // Render sample type symbols
    usedSampleTypes.forEach(type => {
      const description = sampleTypeDescriptions[type] || type;
      const isSPT = type === 'SPT';

      // Sample marker
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      marker.setAttribute('x', symbolX);
      marker.setAttribute('y', symbolsY);
      marker.setAttribute('width', swatchSize);
      marker.setAttribute('height', swatchSize);
      marker.setAttribute('fill', isSPT ? '#fff3cd' : '#d4edda');
      marker.setAttribute('stroke', colors.border);
      marker.setAttribute('rx', '2');
      parent.appendChild(marker);

      // Type label
      const typeLabel = this.createText(type, symbolX + swatchSize + 5, symbolsY + 12, {
        fontSize: '9px',
        fontWeight: 'bold'
      });
      parent.appendChild(typeLabel);

      // Description
      const descLabel = this.createText(description, symbolX + swatchSize + 45, symbolsY + 12, {
        fontSize: '8px',
        fill: '#555'
      });
      parent.appendChild(descLabel);

      symbolX += 180;
    });

    // Groundwater symbol (only if present in data)
    if (hasGroundwater) {
      // GW triangle
      const gwTriangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      gwTriangle.setAttribute('points', `${symbolX + 8},${symbolsY + 8} ${symbolX},${symbolsY} ${symbolX},${symbolsY + 16}`);
      gwTriangle.setAttribute('fill', colors.groundwater);
      parent.appendChild(gwTriangle);

      const gwLabel = this.createText('Groundwater level', symbolX + 15, symbolsY + 12, {
        fontSize: '9px'
      });
      parent.appendChild(gwLabel);
    }
  }

  getPatternId(uscs) {
    // Handle dual classifications like "GP-GM"
    const upperUSCS = uscs.toUpperCase();
    const primary = upperUSCS.split('-')[0];

    // Check for exact match first
    if (this.knownPatterns && this.knownPatterns.has(upperUSCS)) {
      return `pattern-${upperUSCS}`;
    }
    // Check for primary code (first part of dual classification)
    if (this.knownPatterns && this.knownPatterns.has(primary)) {
      return `pattern-${primary}`;
    }
    // Fall back to default pattern for unknown codes
    return 'pattern-DEFAULT';
  }

  createText(content, x, y, options = {}) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('fill', options.fill || this.config.colors.text);
    text.setAttribute('font-size', options.fontSize || '12px');
    if (options.fontWeight) text.setAttribute('font-weight', options.fontWeight);
    if (options.textAnchor) text.setAttribute('text-anchor', options.textAnchor);
    text.textContent = content;
    return text;
  }

  renderWrappedText(parent, text, x, y, maxWidth, maxHeight) {
    const words = text.split(' ');
    const lineHeight = 12;
    let line = '';
    let lineY = y;

    // Create temporary text element to measure
    const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tempText.setAttribute('font-size', '10px');
    parent.appendChild(tempText);

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      tempText.textContent = testLine;
      const width = tempText.getComputedTextLength ? tempText.getComputedTextLength() : testLine.length * 5;

      if (width > maxWidth && line) {
        if (lineY - y + lineHeight > maxHeight) break;

        const textEl = this.createText(line, x, lineY, { fontSize: '10px' });
        parent.appendChild(textEl);
        line = word;
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line && lineY - y + lineHeight <= maxHeight) {
      const textEl = this.createText(line, x, lineY, { fontSize: '10px' });
      parent.appendChild(textEl);
    }

    parent.removeChild(tempText);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BoringLog;
}
