/**
 * Interactive Form Editor for Boring Log Data
 * Accordion-based form with blur-triggered preview updates
 */

class FormEditor {
  constructor(container, boringLog) {
    this.container = container;
    this.boringLog = boringLog;
    this.data = null;
    this.sections = [];
    this.expandedSections = new Set(['boring']); // Default expanded section

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'form-editor';

    // Create section definitions
    this.sectionDefs = [
      { id: 'boring', label: 'Boring Information', icon: '📍' },
      { id: 'people', label: 'Consultant & Driller', icon: '👤' },
      { id: 'layers', label: 'Soil Layers', icon: '🪨' },
      { id: 'samples', label: 'Samples', icon: '🧪' },
      { id: 'groundwater', label: 'Groundwater', icon: '💧' },
      { id: 'well', label: 'Well Construction', icon: '⚙️' }
    ];
  }

  setData(data) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.render();
  }

  getData() {
    return this.data;
  }

  render() {
    this.container.innerHTML = '';

    if (!this.data) {
      this.container.innerHTML = '<p class="form-empty">No data loaded</p>';
      return;
    }

    // Render each accordion section
    this.sectionDefs.forEach(def => {
      const section = this.createSection(def);
      this.container.appendChild(section);
    });
  }

  createSection(def) {
    const section = document.createElement('div');
    section.className = 'accordion-section';
    section.dataset.section = def.id;

    const isExpanded = this.expandedSections.has(def.id);
    const count = this.getSectionCount(def.id);
    const countLabel = count !== null ? ` (${count})` : '';

    // Header
    const header = document.createElement('div');
    header.className = 'accordion-header' + (isExpanded ? ' expanded' : '');
    header.innerHTML = `
      <span class="accordion-icon">${isExpanded ? '▼' : '▶'}</span>
      <span class="accordion-label">${def.label}${countLabel}</span>
    `;
    header.addEventListener('click', () => this.toggleSection(def.id));

    // Content
    const content = document.createElement('div');
    content.className = 'accordion-content' + (isExpanded ? ' expanded' : '');

    if (isExpanded) {
      this.renderSectionContent(content, def.id);
    }

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  getSectionCount(sectionId) {
    if (!this.data) return null;
    switch (sectionId) {
      case 'layers':
        return this.data.layers?.length || 0;
      case 'samples':
        return this.data.samples?.length || 0;
      default:
        return null;
    }
  }

  toggleSection(sectionId) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
    this.render();
  }

  renderSectionContent(container, sectionId) {
    switch (sectionId) {
      case 'boring':
        this.renderBoringSection(container);
        break;
      case 'people':
        this.renderPeopleSection(container);
        break;
      case 'layers':
        this.renderLayersSection(container);
        break;
      case 'samples':
        this.renderSamplesSection(container);
        break;
      case 'groundwater':
        this.renderGroundwaterSection(container);
        break;
      case 'well':
        this.renderWellSection(container);
        break;
    }
  }

  // Create a form field with label and input
  createField(label, value, path, options = {}) {
    const { type = 'text', placeholder = '', selectOptions = null } = options;

    const field = document.createElement('div');
    field.className = 'form-field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    field.appendChild(labelEl);

    let input;
    if (selectOptions) {
      input = document.createElement('select');
      selectOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value !== undefined ? opt.value : opt;
        option.textContent = opt.label !== undefined ? opt.label : opt;
        if (option.value === String(value)) {
          option.selected = true;
        }
        input.appendChild(option);
      });
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
      input.value = value || '';
      input.placeholder = placeholder;
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = type;
      input.value = value || '';
      input.placeholder = placeholder;
    }

    input.dataset.path = path;
    input.addEventListener('blur', (e) => this.handleFieldBlur(e));
    input.addEventListener('change', (e) => {
      if (selectOptions) this.handleFieldBlur(e);
    });

    field.appendChild(input);
    return field;
  }

  // Create a row of fields
  createFieldRow(...fields) {
    const row = document.createElement('div');
    row.className = 'form-row';
    fields.forEach(field => row.appendChild(field));
    return row;
  }

  handleFieldBlur(e) {
    const path = e.target.dataset.path;
    let value = e.target.value;

    // Convert to number if appropriate
    if (e.target.type === 'number' && value !== '') {
      value = parseFloat(value);
    }

    // Update data at path
    this.setValueAtPath(path, value);

    // Update preview
    this.updatePreview();
  }

  setValueAtPath(path, value) {
    const parts = path.split('.');
    let obj = this.data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Handle array indices
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, key, index] = match;
        if (!obj[key]) obj[key] = [];
        if (!obj[key][index]) obj[key][index] = {};
        obj = obj[key][index];
      } else {
        if (!obj[part]) obj[part] = {};
        obj = obj[part];
      }
    }

    const lastPart = parts[parts.length - 1];
    obj[lastPart] = value;
  }

  getValueAtPath(path) {
    const parts = path.split('.');
    let obj = this.data;

    for (const part of parts) {
      if (obj === undefined || obj === null) return undefined;
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, key, index] = match;
        obj = obj[key]?.[index];
      } else {
        obj = obj[part];
      }
    }
    return obj;
  }

  updatePreview() {
    if (this.boringLog && this.data) {
      this.boringLog.setData(this.data);
    }
  }

  // Section renderers
  renderBoringSection(container) {
    const boring = this.data.boring || {};

    const grid = document.createElement('div');
    grid.className = 'form-grid';

    grid.appendChild(this.createFieldRow(
      this.createField('Boring ID', boring.id, 'boring.id', { placeholder: 'B-1' }),
      this.createField('Total Depth (ft)', boring.totalDepth, 'boring.totalDepth', { type: 'number' })
    ));

    grid.appendChild(this.createField('Project', boring.project, 'boring.project'));
    grid.appendChild(this.createField('Client', boring.client, 'boring.client'));

    grid.appendChild(this.createFieldRow(
      this.createField('Date Start', boring.dateStart || boring.date, 'boring.dateStart', { type: 'date' }),
      this.createField('Date Complete', boring.dateComplete, 'boring.dateComplete', { type: 'date' })
    ));

    grid.appendChild(this.createFieldRow(
      this.createField('Time', boring.time, 'boring.time', { type: 'time' }),
      this.createField('Weather', boring.weather, 'boring.weather')
    ));

    grid.appendChild(this.createFieldRow(
      this.createField('Elevation (ft)', boring.elevation, 'boring.elevation', { type: 'number' }),
      this.createField('Equipment', boring.equipment, 'boring.equipment')
    ));

    grid.appendChild(this.createFieldRow(
      this.createField('Drilling Method', boring.drillingMethod, 'boring.drillingMethod'),
      this.createField('Logged By', boring.loggedBy, 'boring.loggedBy')
    ));

    // Location
    const location = boring.location || {};
    grid.appendChild(document.createElement('hr'));
    const locLabel = document.createElement('div');
    locLabel.className = 'form-subsection-label';
    locLabel.textContent = 'Location';
    grid.appendChild(locLabel);

    grid.appendChild(this.createFieldRow(
      this.createField('Coord 1 (Lat/X)', location.coords?.[0], 'boring.location.coords.0', { type: 'number' }),
      this.createField('Coord 2 (Long/Y)', location.coords?.[1], 'boring.location.coords.1', { type: 'number' })
    ));

    grid.appendChild(this.createField('Coordinate System', location.system, 'boring.location.system', { placeholder: 'WGS84' }));

    container.appendChild(grid);
  }

  renderPeopleSection(container) {
    const boring = this.data.boring || {};
    const consultant = boring.consultant || {};
    const driller = boring.driller || {};

    const grid = document.createElement('div');
    grid.className = 'form-grid';

    // Consultant
    const consultantLabel = document.createElement('div');
    consultantLabel.className = 'form-subsection-label';
    consultantLabel.textContent = 'Consultant';
    grid.appendChild(consultantLabel);

    grid.appendChild(this.createField('Company', consultant.company, 'boring.consultant.company'));
    grid.appendChild(this.createField('Contact', consultant.contact, 'boring.consultant.contact'));
    grid.appendChild(this.createField('Phone', consultant.phone, 'boring.consultant.phone', { type: 'tel' }));

    // Driller
    grid.appendChild(document.createElement('hr'));
    const drillerLabel = document.createElement('div');
    drillerLabel.className = 'form-subsection-label';
    drillerLabel.textContent = 'Driller';
    grid.appendChild(drillerLabel);

    grid.appendChild(this.createField('Company', driller.company, 'boring.driller.company'));
    grid.appendChild(this.createField('Name', driller.name, 'boring.driller.name'));
    grid.appendChild(this.createField('License', driller.license, 'boring.driller.license'));

    container.appendChild(grid);
  }

  renderLayersSection(container) {
    const layers = this.data.layers || [];

    // Add layer button
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ Add Layer';
    addBtn.addEventListener('click', () => this.addLayer());
    container.appendChild(addBtn);

    if (layers.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'form-empty';
      empty.textContent = 'No layers defined';
      container.appendChild(empty);
      return;
    }

    // Layer cards
    layers.forEach((layer, index) => {
      const card = this.createLayerCard(layer, index);
      container.appendChild(card);
    });
  }

  createLayerCard(layer, index) {
    const card = document.createElement('div');
    card.className = 'card';

    // Card header with summary
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <span class="card-title">Layer ${index + 1}: ${layer.uscs || '?'} (${layer.depthTop || 0} - ${layer.depthBottom || 0} ft)</span>
      <button class="btn-delete" data-index="${index}">×</button>
    `;
    header.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeLayer(index);
    });
    card.appendChild(header);

    // Card body
    const body = document.createElement('div');
    body.className = 'card-body';

    body.appendChild(this.createFieldRow(
      this.createField('Depth Top (ft)', layer.depthTop, `layers[${index}].depthTop`, { type: 'number' }),
      this.createField('Depth Bottom (ft)', layer.depthBottom, `layers[${index}].depthBottom`, { type: 'number' })
    ));

    body.appendChild(this.createField('USCS', layer.uscs, `layers[${index}].uscs`, {
      selectOptions: [
        { value: '', label: '-- Select --' },
        { value: 'GW', label: 'GW - Well-graded gravel' },
        { value: 'GP', label: 'GP - Poorly graded gravel' },
        { value: 'GM', label: 'GM - Silty gravel' },
        { value: 'GC', label: 'GC - Clayey gravel' },
        { value: 'SW', label: 'SW - Well-graded sand' },
        { value: 'SP', label: 'SP - Poorly graded sand' },
        { value: 'SM', label: 'SM - Silty sand' },
        { value: 'SC', label: 'SC - Clayey sand' },
        { value: 'ML', label: 'ML - Silt (low plasticity)' },
        { value: 'MH', label: 'MH - Silt (high plasticity)' },
        { value: 'CL', label: 'CL - Clay (low plasticity)' },
        { value: 'CH', label: 'CH - Clay (high plasticity)' },
        { value: 'OL', label: 'OL - Organic silt' },
        { value: 'OH', label: 'OH - Organic clay' },
        { value: 'PT', label: 'PT - Peat' },
        { value: 'TS', label: 'TS - Topsoil' },
        { value: 'FILL', label: 'FILL - Fill material' },
        { value: 'ROCK', label: 'ROCK - Rock' }
      ]
    }));

    body.appendChild(this.createField('Description', layer.description, `layers[${index}].description`, { type: 'textarea' }));

    body.appendChild(this.createFieldRow(
      this.createField('Moisture', layer.moisture, `layers[${index}].moisture`, {
        selectOptions: ['', 'dry', 'moist', 'wet', 'saturated']
      }),
      this.createField('Odor', layer.odor, `layers[${index}].odor`, {
        selectOptions: ['', 'none', 'petroleum', 'chlorinated', 'organic', 'other']
      })
    ));

    body.appendChild(this.createField('PID (ppm)', layer.pid, `layers[${index}].pid`, { type: 'number' }));

    card.appendChild(body);
    return card;
  }

  addLayer() {
    if (!this.data.layers) this.data.layers = [];
    const lastLayer = this.data.layers[this.data.layers.length - 1];
    const newTop = lastLayer ? lastLayer.depthBottom : 0;

    this.data.layers.push({
      depthTop: newTop,
      depthBottom: newTop + 5,
      uscs: '',
      description: '',
      moisture: '',
      odor: '',
      pid: null
    });

    this.render();
    this.updatePreview();
  }

  removeLayer(index) {
    this.data.layers.splice(index, 1);
    this.render();
    this.updatePreview();
  }

  renderSamplesSection(container) {
    const samples = this.data.samples || [];

    // Add sample button
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ Add Sample';
    addBtn.addEventListener('click', () => this.addSample());
    container.appendChild(addBtn);

    if (samples.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'form-empty';
      empty.textContent = 'No samples defined';
      container.appendChild(empty);
      return;
    }

    // Sample cards
    samples.forEach((sample, index) => {
      const card = this.createSampleCard(sample, index);
      container.appendChild(card);
    });
  }

  createSampleCard(sample, index) {
    const card = document.createElement('div');
    card.className = 'card';

    // Determine depth display
    const depthDisplay = sample.depthTop !== undefined
      ? `${sample.depthTop} - ${sample.depthBottom} ft`
      : `${sample.depth} ft`;

    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <span class="card-title">${sample.id || 'Sample ' + (index + 1)}: ${sample.type || '?'} @ ${depthDisplay}</span>
      <button class="btn-delete" data-index="${index}">×</button>
    `;
    header.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeSample(index);
    });
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'card-body';

    body.appendChild(this.createFieldRow(
      this.createField('Sample ID', sample.id, `samples[${index}].id`),
      this.createField('Type', sample.type, `samples[${index}].type`, {
        selectOptions: ['', 'SPT', 'SHELBY', 'GRAB', 'CORE', 'OTHER']
      })
    ));

    body.appendChild(this.createFieldRow(
      this.createField('Depth Top (ft)', sample.depthTop, `samples[${index}].depthTop`, { type: 'number' }),
      this.createField('Depth Bottom (ft)', sample.depthBottom, `samples[${index}].depthBottom`, { type: 'number' })
    ));

    // SPT blows (only for SPT type)
    const blowsLabel = document.createElement('div');
    blowsLabel.className = 'form-subsection-label';
    blowsLabel.textContent = 'SPT Blows (6" intervals)';
    body.appendChild(blowsLabel);

    const blows = sample.blows || [null, null, null];
    body.appendChild(this.createFieldRow(
      this.createField('Blow 1', blows[0], `samples[${index}].blows.0`, { type: 'number' }),
      this.createField('Blow 2', blows[1], `samples[${index}].blows.1`, { type: 'number' }),
      this.createField('Blow 3', blows[2], `samples[${index}].blows.2`, { type: 'number' })
    ));

    body.appendChild(this.createField('Recovery (in)', sample.recovery, `samples[${index}].recovery`, { type: 'number' }));

    card.appendChild(body);
    return card;
  }

  addSample() {
    if (!this.data.samples) this.data.samples = [];
    const sampleNum = this.data.samples.length + 1;

    this.data.samples.push({
      id: `S-${sampleNum}`,
      type: 'SPT',
      depthTop: 0,
      depthBottom: 1.5,
      blows: [0, 0, 0],
      recovery: 18
    });

    this.render();
    this.updatePreview();
  }

  removeSample(index) {
    this.data.samples.splice(index, 1);
    this.render();
    this.updatePreview();
  }

  renderGroundwaterSection(container) {
    const gw = this.data.groundwater || {};

    const grid = document.createElement('div');
    grid.className = 'form-grid';

    grid.appendChild(this.createField('Depth (ft)', gw.depth, 'groundwater.depth', { type: 'number' }));
    grid.appendChild(this.createField('Notes', gw.note, 'groundwater.note', { type: 'textarea' }));

    container.appendChild(grid);
  }

  renderWellSection(container) {
    const well = this.data.well || {};

    const grid = document.createElement('div');
    grid.className = 'form-grid';

    grid.appendChild(this.createFieldRow(
      this.createField('Type', well.type, 'well.type', {
        selectOptions: ['', 'monitoring', 'production', 'piezometer']
      }),
      this.createField('Casing Diameter (in)', well.casingDiameter, 'well.casingDiameter', { type: 'number' })
    ));

    grid.appendChild(this.createField('Casing Material', well.casingMaterial, 'well.casingMaterial'));

    grid.appendChild(document.createElement('hr'));
    const screenLabel = document.createElement('div');
    screenLabel.className = 'form-subsection-label';
    screenLabel.textContent = 'Screen';
    grid.appendChild(screenLabel);

    grid.appendChild(this.createFieldRow(
      this.createField('Screen Top (ft)', well.screenTop, 'well.screenTop', { type: 'number' }),
      this.createField('Screen Bottom (ft)', well.screenBottom, 'well.screenBottom', { type: 'number' })
    ));

    grid.appendChild(this.createFieldRow(
      this.createField('Slot Size (in)', well.screenSlotSize, 'well.screenSlotSize', { type: 'number' }),
      this.createField('Filter Pack', well.filterPack, 'well.filterPack')
    ));

    grid.appendChild(document.createElement('hr'));
    const sealLabel = document.createElement('div');
    sealLabel.className = 'form-subsection-label';
    sealLabel.textContent = 'Seal';
    grid.appendChild(sealLabel);

    grid.appendChild(this.createFieldRow(
      this.createField('Seal Top (ft)', well.sealTop, 'well.sealTop', { type: 'number' }),
      this.createField('Seal Bottom (ft)', well.sealBottom, 'well.sealBottom', { type: 'number' })
    ));

    grid.appendChild(this.createField('Seal Material', well.sealMaterial, 'well.sealMaterial'));

    container.appendChild(grid);
  }
}
