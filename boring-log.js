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
      headerHeight: 120,
      footerHeight: 40,
      legendHeight: 140,
      showLegend: true,
      depthScale: 20, // pixels per unit depth
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      columns: {
        depth: { width: 50, label: 'Depth' },
        graphic: { width: 80, label: 'Soil' },
        uscs: { width: 50, label: 'USCS' },
        description: { width: 280, label: 'Description' },
        sample: { width: 60, label: 'Sample' },
        spt: { width: 80, label: 'SPT N-Value' },
        recovery: { width: 50, label: 'Rec. (in)' }
      },
      colors: {
        border: '#333',
        headerBg: '#f5f5f5',
        gridLine: '#ccc',
        groundwater: '#0066cc',
        text: '#333'
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

    const { width, headerHeight, footerHeight, legendHeight, showLegend, margins, depthScale, columns } = this.config;
    const totalDepth = this.data.boring.totalDepth || 30;
    const graphicHeight = totalDepth * depthScale;
    const legendSpace = showLegend ? legendHeight : 0;
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
    this.renderHeader(mainGroup, width - margins.left - margins.right);
    this.renderColumnHeaders(mainGroup, headerHeight - 30);
    this.renderDepthScale(mainGroup, headerHeight, graphicHeight, totalDepth);
    this.renderSoilLayers(mainGroup, headerHeight, graphicHeight, totalDepth);
    this.renderSamples(mainGroup, headerHeight, totalDepth);
    this.renderGroundwater(mainGroup, headerHeight, totalDepth);
    if (showLegend) {
      this.renderLegend(mainGroup, headerHeight + graphicHeight + footerHeight, width - margins.left - margins.right);
    }
    this.renderBorder(mainGroup, width - margins.left - margins.right, height - margins.top - margins.bottom);

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
      'PT': { type: 'peat', fill: '#4a3728' }
    };

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

  renderHeader(parent, width) {
    const { boring, groundwater } = this.data;
    const { colors } = this.config;

    // Header background
    const headerBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    headerBg.setAttribute('x', '0');
    headerBg.setAttribute('y', '0');
    headerBg.setAttribute('width', width);
    headerBg.setAttribute('height', '90');
    headerBg.setAttribute('fill', colors.headerBg);
    headerBg.setAttribute('stroke', colors.border);
    parent.appendChild(headerBg);

    // Title
    const title = this.createText(`BORING LOG: ${boring.id}`, 10, 22, { fontWeight: 'bold', fontSize: '14px' });
    parent.appendChild(title);

    // Project
    const project = this.createText(`Project: ${boring.project}`, 10, 40, { fontSize: '11px' });
    parent.appendChild(project);

    // Location and elevation
    const locText = boring.location
      ? `Location: ${boring.location.coords.join(', ')} (${boring.location.system})`
      : '';
    const location = this.createText(locText, 10, 55, { fontSize: '10px' });
    parent.appendChild(location);

    const elevation = this.createText(`Elevation: ${boring.elevation} ft`, 10, 70, { fontSize: '10px' });
    parent.appendChild(elevation);

    // Right side info
    const date = this.createText(`Date: ${boring.date}`, width - 10, 40, { fontSize: '10px', textAnchor: 'end' });
    parent.appendChild(date);

    const driller = this.createText(`Driller: ${boring.driller}`, width - 10, 55, { fontSize: '10px', textAnchor: 'end' });
    parent.appendChild(driller);

    const totalDepth = this.createText(`Total Depth: ${boring.totalDepth} ft`, width - 10, 70, { fontSize: '10px', textAnchor: 'end' });
    parent.appendChild(totalDepth);

    if (groundwater && groundwater.depth !== undefined) {
      const gwText = `GW Depth: ${groundwater.depth} ft${groundwater.note ? ` (${groundwater.note})` : ''}`;
      const gw = this.createText(gwText, width - 10, 85, { fontSize: '10px', textAnchor: 'end', fill: colors.groundwater });
      parent.appendChild(gw);
    }
  }

  renderColumnHeaders(parent, y) {
    const { columns, colors } = this.config;
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
        fontSize: '10px',
        fontWeight: 'bold',
        textAnchor: 'middle'
      });
      parent.appendChild(label);

      x += col.width;
    }
  }

  renderDepthScale(parent, startY, height, totalDepth) {
    const { columns, colors, depthScale } = this.config;
    const colWidth = columns.depth.width;

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', startY);
    bg.setAttribute('width', colWidth);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', colors.border);
    parent.appendChild(bg);

    // Depth markers
    const interval = totalDepth <= 20 ? 2 : 5;
    for (let d = 0; d <= totalDepth; d += interval) {
      const y = startY + d * depthScale;

      // Tick mark
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', colWidth - 10);
      tick.setAttribute('y1', y);
      tick.setAttribute('x2', colWidth);
      tick.setAttribute('y2', y);
      tick.setAttribute('stroke', colors.border);
      parent.appendChild(tick);

      // Label
      const label = this.createText(d.toString(), colWidth - 15, y + 4, {
        fontSize: '9px',
        textAnchor: 'end'
      });
      parent.appendChild(label);

      // Grid line across all columns
      if (d > 0 && d < totalDepth) {
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', colWidth);
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
    const { columns, colors, depthScale } = this.config;
    const { layers } = this.data;

    const graphicX = columns.depth.width;
    const uscsX = graphicX + columns.graphic.width;
    const descX = uscsX + columns.uscs.width;

    for (const layer of layers) {
      const y1 = startY + layer.depthTop * depthScale;
      const y2 = startY + layer.depthBottom * depthScale;
      const layerHeight = y2 - y1;

      // Soil graphic pattern
      const patternId = this.getPatternId(layer.uscs);
      const graphic = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      graphic.setAttribute('x', graphicX);
      graphic.setAttribute('y', y1);
      graphic.setAttribute('width', columns.graphic.width);
      graphic.setAttribute('height', layerHeight);
      graphic.setAttribute('fill', `url(#${patternId})`);
      graphic.setAttribute('stroke', colors.border);
      parent.appendChild(graphic);

      // USCS label
      const uscsLabel = this.createText(layer.uscs, uscsX + columns.uscs.width / 2, y1 + layerHeight / 2 + 4, {
        fontSize: '10px',
        fontWeight: 'bold',
        textAnchor: 'middle'
      });
      parent.appendChild(uscsLabel);

      // Description (with text wrapping)
      this.renderWrappedText(parent, layer.description, descX + 5, y1 + 15, columns.description.width - 10, layerHeight - 10);

      // Layer boundary line
      if (layer.depthTop > 0) {
        const boundary = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        boundary.setAttribute('x1', graphicX);
        boundary.setAttribute('y1', y1);
        boundary.setAttribute('x2', descX + columns.description.width);
        boundary.setAttribute('y2', y1);
        boundary.setAttribute('stroke', colors.border);
        boundary.setAttribute('stroke-width', '1.5');
        parent.appendChild(boundary);
      }
    }

    // Column backgrounds for sample/SPT/recovery
    const sampleX = descX + columns.description.width;
    const sptX = sampleX + columns.sample.width;
    const recoveryX = sptX + columns.spt.width;

    [
      { x: uscsX, w: columns.uscs.width },
      { x: sampleX, w: columns.sample.width },
      { x: sptX, w: columns.spt.width },
      { x: recoveryX, w: columns.recovery.width }
    ].forEach(({ x, w }) => {
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', x);
      bg.setAttribute('y', startY);
      bg.setAttribute('width', w);
      bg.setAttribute('height', height);
      bg.setAttribute('fill', 'white');
      bg.setAttribute('stroke', colors.border);
      parent.appendChild(bg);
    });
  }

  renderSamples(parent, startY, totalDepth) {
    const { columns, colors, depthScale } = this.config;
    const { samples } = this.data;

    if (!samples) return;

    const sampleX = columns.depth.width + columns.graphic.width + columns.uscs.width + columns.description.width;
    const sptX = sampleX + columns.sample.width;
    const recoveryX = sptX + columns.spt.width;

    for (const sample of samples) {
      const y = startY + sample.depth * depthScale;

      // Sample marker and ID
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      marker.setAttribute('x', sampleX + 5);
      marker.setAttribute('y', y - 8);
      marker.setAttribute('width', columns.sample.width - 10);
      marker.setAttribute('height', '16');
      marker.setAttribute('fill', sample.type === 'SPT' ? '#fff3cd' : '#d4edda');
      marker.setAttribute('stroke', colors.border);
      marker.setAttribute('rx', '2');
      parent.appendChild(marker);

      const idLabel = this.createText(sample.id, sampleX + columns.sample.width / 2, y + 4, {
        fontSize: '8px',
        textAnchor: 'middle'
      });
      parent.appendChild(idLabel);

      // SPT N-value
      if (sample.blows && sample.blows.length === 3) {
        const nValue = sample.blows[1] + sample.blows[2];
        const blowsText = sample.blows.join('-');

        const nLabel = this.createText(`N=${nValue}`, sptX + columns.spt.width / 2, y - 2, {
          fontSize: '10px',
          fontWeight: 'bold',
          textAnchor: 'middle'
        });
        parent.appendChild(nLabel);

        const blowsLabel = this.createText(`(${blowsText})`, sptX + columns.spt.width / 2, y + 10, {
          fontSize: '8px',
          textAnchor: 'middle',
          fill: '#666'
        });
        parent.appendChild(blowsLabel);
      }

      // Recovery
      if (sample.recovery !== undefined) {
        const recLabel = this.createText(sample.recovery.toString(), recoveryX + columns.recovery.width / 2, y + 4, {
          fontSize: '10px',
          textAnchor: 'middle'
        });
        parent.appendChild(recLabel);
      }

      // Depth indicator line
      const depthLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      depthLine.setAttribute('x1', columns.depth.width);
      depthLine.setAttribute('y1', y);
      depthLine.setAttribute('x2', sampleX);
      depthLine.setAttribute('y2', y);
      depthLine.setAttribute('stroke', '#999');
      depthLine.setAttribute('stroke-dasharray', '1,2');
      parent.appendChild(depthLine);
    }
  }

  renderGroundwater(parent, startY, totalDepth) {
    const { groundwater } = this.data;
    if (!groundwater || groundwater.depth === undefined) return;

    const { columns, colors, depthScale } = this.config;
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

  renderLegend(parent, startY, width) {
    const { colors } = this.config;
    const { layers, groundwater } = this.data;

    // USCS soil descriptions
    const allDescriptions = {
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
      'PT': 'Peat'
    };

    // Get unique USCS codes used in this diagram
    const usedCodes = new Set();
    if (layers) {
      layers.forEach(layer => {
        // Handle dual classifications like "GP-GM" - add both parts
        const parts = layer.uscs.split('-');
        parts.forEach(code => usedCodes.add(code));
      });
    }

    // Filter to only used codes
    const entries = Object.entries(allDescriptions).filter(([code]) => usedCodes.has(code));

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
    const primary = uscs.split('-')[0];
    if (document.getElementById(`pattern-${uscs}`)) {
      return `pattern-${uscs}`;
    }
    return `pattern-${primary}`;
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
