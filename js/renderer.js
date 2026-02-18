// ============================================================
// THE SUNDERING WAR - Renderer
// Handles all visual rendering of the game
// ============================================================
window.GAME = window.GAME || {};

GAME.Renderer = (function() {
  const MAP_W = 1120;
  const MAP_H = 740;
  let mapSvg = null;

  function init() {
    mapSvg = document.getElementById('map-svg');
    if (!mapSvg) return;
    drawMap();
    window.addEventListener('resize', handleResize);
    handleResize();
  }

  function handleResize() {}

  function drawMap() {
    if (!mapSvg) return;
    mapSvg.innerHTML = '';
    mapSvg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`);

    // ---- SVG Defs ----
    const defs = svgEl('defs');

    // Background gradient
    const bgGrad = svgEl('radialGradient', { id: 'bg-grad', cx: '35%', cy: '35%', r: '75%' });
    bgGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#e8d8b0' }));
    bgGrad.appendChild(svgEl('stop', { offset: '60%', 'stop-color': '#d4c090' }));
    bgGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#c0a870' }));
    defs.appendChild(bgGrad);

    // Mordor dark gradient
    const mordorGrad = svgEl('radialGradient', { id: 'mordor-grad', cx: '50%', cy: '50%', r: '50%' });
    mordorGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#1a0a0a', 'stop-opacity': '0.35' }));
    mordorGrad.appendChild(svgEl('stop', { offset: '70%', 'stop-color': '#2a1010', 'stop-opacity': '0.15' }));
    mordorGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#2a1010', 'stop-opacity': '0' }));
    defs.appendChild(mordorGrad);

    // Dawn glow
    const dawnGrad = svgEl('radialGradient', { id: 'dawn-glow', cx: '50%', cy: '50%', r: '50%' });
    dawnGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#f0e0a0', 'stop-opacity': '0.15' }));
    dawnGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#f0e0a0', 'stop-opacity': '0' }));
    defs.appendChild(dawnGrad);

    // Glow filter
    const glow = svgEl('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    glow.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2', result: 'blur' }));
    const merge = svgEl('feMerge');
    merge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
    merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    glow.appendChild(merge);
    defs.appendChild(glow);

    // Drop shadow
    const shadow = svgEl('filter', { id: 'dropshadow', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    shadow.appendChild(svgEl('feDropShadow', { dx: '0', dy: '1', stdDeviation: '1.5', 'flood-color': '#000', 'flood-opacity': '0.3' }));
    defs.appendChild(shadow);

    // Pattern for parchment texture
    const pattern = svgEl('pattern', { id: 'parchment', width: '200', height: '200', patternUnits: 'userSpaceOnUse' });
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 200;
      const y = Math.random() * 200;
      const r = 0.5 + Math.random() * 1.5;
      pattern.appendChild(svgEl('circle', { cx: x, cy: y, r, fill: '#000', opacity: 0.02 + Math.random() * 0.02 }));
    }
    defs.appendChild(pattern);

    mapSvg.appendChild(defs);

    // ---- Background layers ----
    mapSvg.appendChild(svgEl('rect', { x: 0, y: 0, width: MAP_W, height: MAP_H, fill: 'url(#bg-grad)' }));
    mapSvg.appendChild(svgEl('rect', { x: 0, y: 0, width: MAP_W, height: MAP_H, fill: 'url(#parchment)' }));

    // Ocean on left
    mapSvg.appendChild(svgEl('path', {
      d: 'M 0 0 L 0 740 L 40 740 Q 50 550 30 400 Q 50 250 35 100 Q 40 30 30 0 Z',
      fill: '#4a7a9a', opacity: 0.25,
    }));

    // Southern sea
    mapSvg.appendChild(svgEl('path', {
      d: 'M 400 740 Q 500 710 650 720 Q 800 710 950 740 L 400 740 Z',
      fill: '#4a7a9a', opacity: 0.15,
    }));

    // Dawn lands glow (west)
    mapSvg.appendChild(svgEl('ellipse', { cx: 200, cy: 300, rx: 250, ry: 250, fill: 'url(#dawn-glow)' }));

    // Mordor shadow (east)
    mapSvg.appendChild(svgEl('ellipse', { cx: 950, cy: 440, rx: 150, ry: 130, fill: 'url(#mordor-grad)' }));

    // ---- Terrain features ----
    drawTerrainFeatures();

    // ---- Connection lines ----
    GAME.Connections.forEach(([a, b]) => {
      const ra = GAME.getRegion(a);
      const rb = GAME.getRegion(b);
      if (ra && rb) {
        // Check if crossing through shadow lands
        const inShadow = GAME.ShadowRegions.includes(a) && GAME.ShadowRegions.includes(b);
        const line = svgEl('line', {
          x1: ra.x, y1: ra.y, x2: rb.x, y2: rb.y,
          stroke: inShadow ? '#5a3a2a' : '#8a7a60',
          'stroke-width': 1.2,
          opacity: inShadow ? 0.3 : 0.35,
          'stroke-dasharray': inShadow ? '4,3' : 'none',
          class: 'connection-line',
          'data-from': a, 'data-to': b,
        });
        mapSvg.appendChild(line);
      }
    });

    // ---- Region nodes ----
    GAME.Regions.forEach(r => {
      const g = svgEl('g', {
        class: 'region-group',
        'data-region': r.id,
        transform: `translate(${r.x}, ${r.y})`,
      });

      const nationDef = r.nation ? GAME.Nations[r.nation] : null;
      const side = nationDef ? nationDef.side : null;
      const isSettlement = !!r.settlement;
      const isStronghold = r.settlement === 'stronghold';
      const isCity = r.settlement === 'city';
      const isShadow = GAME.ShadowRegions.includes(r.id);

      // Background glow for settlements
      if (isSettlement) {
        const glowR = isStronghold ? 22 : 18;
        const glowCol = side === 'dawn' ? '#c49a3c' : side === 'dusk' ? '#8b1a1a' : '#8a8a6a';
        g.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: glowR,
          fill: glowCol, opacity: 0.1,
          class: 'region-glow',
        }));
      }

      // Main shape
      const color = getRegionColor(r);
      const borderColor = nationDef ? nationDef.color : (isShadow ? '#4a2a2a' : '#6a5a4a');

      if (isStronghold) {
        // Stronghold: castle-like shape
        const s = 14;
        g.appendChild(svgEl('rect', {
          x: -s, y: -s, width: s * 2, height: s * 2,
          fill: color, stroke: borderColor, 'stroke-width': 2.5, rx: 2,
          class: 'region-shape', filter: 'url(#dropshadow)',
        }));
        // Battlements
        const bw = 4;
        for (let bx = -s; bx < s; bx += bw * 2) {
          g.appendChild(svgEl('rect', {
            x: bx, y: -s - 4, width: bw, height: 4,
            fill: color, stroke: borderColor, 'stroke-width': 1,
            'pointer-events': 'none',
          }));
        }
        // VP indicator
        if (r.vp > 0) {
          g.appendChild(svgEl('text', {
            x: 0, y: 3, 'text-anchor': 'middle',
            fill: '#fff', 'font-size': '10', 'font-weight': 'bold',
            'font-family': 'Cinzel, Georgia, serif',
            'pointer-events': 'none', opacity: 0.8,
          })).textContent = '\u2655'; // Crown symbol
        }
      } else if (isCity) {
        const s = 11;
        g.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: s,
          fill: color, stroke: borderColor, 'stroke-width': 2.5,
          class: 'region-shape', filter: 'url(#dropshadow)',
        }));
        g.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: s - 3,
          fill: 'none', stroke: borderColor, 'stroke-width': 0.8,
          'pointer-events': 'none', opacity: 0.6,
        }));
      } else if (r.settlement === 'town') {
        g.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: 8,
          fill: color, stroke: borderColor, 'stroke-width': 2,
          class: 'region-shape', filter: 'url(#dropshadow)',
        }));
      } else {
        // Regular region: small dot
        g.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: 6,
          fill: color, stroke: borderColor, 'stroke-width': 1.2, opacity: 0.9,
          class: 'region-shape',
        }));
      }

      // Special markers
      if (r.id === 'abyssal_forge') {
        // Volcano / destination
        g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 18, fill: 'none', stroke: '#ff3300', 'stroke-width': 2, opacity: 0.6, 'stroke-dasharray': '3,2' }));
        g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 14, fill: 'none', stroke: '#ff6600', 'stroke-width': 1.5, opacity: 0.4 }));
        g.appendChild(svgEl('text', { x: 0, y: 3, 'text-anchor': 'middle', fill: '#ff4400', 'font-size': '12', 'pointer-events': 'none', opacity: 0.9 })).textContent = '\u2739';
      }

      if (r.id === 'haven') {
        g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 18, fill: 'none', stroke: '#4488ff', 'stroke-width': 1.5, opacity: 0.5, 'stroke-dasharray': '4,2' }));
      }

      // Region name label
      const textY = isStronghold ? 24 : isCity ? 20 : r.settlement === 'town' ? 17 : 14;
      const fontSize = isSettlement ? '9' : '7.5';
      const fontWeight = isSettlement ? '600' : '400';

      const textBg = svgEl('text', {
        x: 0, y: textY, 'text-anchor': 'middle',
        fill: '#d4c090', 'font-size': fontSize, 'font-weight': fontWeight,
        'font-family': 'Cinzel, Georgia, serif',
        'pointer-events': 'none', class: 'region-label-bg',
        stroke: '#d4c090', 'stroke-width': 2.5, 'stroke-linejoin': 'round',
      });
      textBg.textContent = r.name;
      g.appendChild(textBg);

      const text = svgEl('text', {
        x: 0, y: textY, 'text-anchor': 'middle',
        fill: isShadow ? '#3a1a0a' : '#2c1810',
        'font-size': fontSize, 'font-weight': fontWeight,
        'font-family': 'Cinzel, Georgia, serif',
        'pointer-events': 'none', class: 'region-label',
      });
      text.textContent = r.name;
      g.appendChild(text);

      mapSvg.appendChild(g);
    });

    // ---- Map border ----
    mapSvg.appendChild(svgEl('rect', {
      x: 1, y: 1, width: MAP_W - 2, height: MAP_H - 2,
      fill: 'none', stroke: '#6a5a3a', 'stroke-width': 2, rx: 4,
    }));

    // ---- Map title cartouche ----
    const cartG = svgEl('g', { transform: 'translate(950, 680)', 'pointer-events': 'none' });
    cartG.appendChild(svgEl('rect', { x: -80, y: -15, width: 160, height: 30, fill: '#d4c090', stroke: '#8a7a50', 'stroke-width': 1, rx: 4, opacity: 0.8 }));
    const cartText = svgEl('text', { x: 0, y: 5, 'text-anchor': 'middle', fill: '#3a2a1a', 'font-size': '10', 'font-family': 'Cinzel, Georgia, serif', 'font-weight': '600' });
    cartText.textContent = 'The Sundering War';
    cartG.appendChild(cartText);
    mapSvg.appendChild(cartG);
  }

  function getRegionColor(r) {
    const nationDef = r.nation ? GAME.Nations[r.nation] : null;
    if (!nationDef) {
      return GAME.TerrainColors[r.terrain] || '#9a8a6a';
    }
    // Blend nation color with terrain
    const terrainCol = GAME.TerrainColors[r.terrain] || '#8a8a6a';
    if (r.settlement) {
      return nationDef.color;
    }
    return terrainCol;
  }

  function drawTerrainFeatures() {
    // Mountain range (The Shattered Range - center spine)
    const mtns = [
      [330, 215], [350, 235], [370, 255], [390, 270], [410, 255],
      [430, 265], [450, 285], [340, 255], [365, 245], [395, 260],
    ];
    mtns.forEach(([x, y]) => {
      const h = 8 + Math.random() * 6;
      const w = 6 + Math.random() * 4;
      const points = `${x},${y - h} ${x - w},${y + 2} ${x + w},${y + 2}`;
      mapSvg.appendChild(svgEl('polygon', {
        points, fill: '#8a7a60', opacity: 0.25, 'pointer-events': 'none',
      }));
      // Snow cap
      const snowPts = `${x},${y - h} ${x - w * 0.4},${y - h * 0.4} ${x + w * 0.4},${y - h * 0.4}`;
      mapSvg.appendChild(svgEl('polygon', {
        points: snowPts, fill: '#e0d8c0', opacity: 0.3, 'pointer-events': 'none',
      }));
    });

    // Northeastern mountains (Deepforge area)
    [[790, 75], [810, 90], [780, 95], [865, 135], [875, 145]].forEach(([x, y]) => {
      const h = 7 + Math.random() * 5;
      const w = 5 + Math.random() * 3;
      mapSvg.appendChild(svgEl('polygon', {
        points: `${x},${y - h} ${x - w},${y + 2} ${x + w},${y + 2}`,
        fill: '#7a6a50', opacity: 0.25, 'pointer-events': 'none',
      }));
    });

    // Forest patches
    const forests = [
      [500, 325, 6], [510, 335, 5], [485, 330, 5], // Ancient Wood
      [570, 285, 6], [580, 295, 5], [565, 290, 4], // Crystal Falls
      [670, 125, 5], [680, 135, 5], [660, 130, 4], // Deepwood
      [715, 415, 5], [710, 425, 4], // Silverwood
    ];
    forests.forEach(([x, y, s]) => {
      // Simple tree shape
      mapSvg.appendChild(svgEl('circle', {
        cx: x, cy: y, r: s,
        fill: '#3a6a3a', opacity: 0.2, 'pointer-events': 'none',
      }));
      mapSvg.appendChild(svgEl('circle', {
        cx: x, cy: y - 3, r: s * 0.7,
        fill: '#4a7a4a', opacity: 0.15, 'pointer-events': 'none',
      }));
    });

    // Rivers
    const riverPoints = 'M 420,510 Q 470,490 500,530 Q 530,560 560,610 Q 570,640 580,660';
    mapSvg.appendChild(svgEl('path', {
      d: riverPoints, fill: 'none', stroke: '#5a8aaa', 'stroke-width': 2,
      opacity: 0.3, 'pointer-events': 'none',
    }));

    // Second river
    mapSvg.appendChild(svgEl('path', {
      d: 'M 580,300 Q 590,340 600,370 Q 610,400 620,420 Q 640,460 660,500',
      fill: 'none', stroke: '#5a8aaa', 'stroke-width': 1.5,
      opacity: 0.25, 'pointer-events': 'none',
    }));

    // Mordor inner boundary (rough border)
    mapSvg.appendChild(svgEl('path', {
      d: 'M 820,350 Q 860,370 890,400 Q 920,420 950,410 Q 1000,395 1050,380 Q 1070,400 1050,440 Q 1020,480 1000,520 Q 960,550 920,540 Q 880,530 860,510 Q 830,490 820,460 Q 810,420 820,350 Z',
      fill: 'none', stroke: '#4a2a1a', 'stroke-width': 1.5,
      opacity: 0.2, 'stroke-dasharray': '6,4', 'pointer-events': 'none',
    }));

    // Compass rose (simplified)
    const cx = 80, cy = 680;
    mapSvg.appendChild(svgEl('circle', { cx, cy, r: 18, fill: '#d4c090', stroke: '#8a7a50', 'stroke-width': 1, opacity: 0.7 }));
    mapSvg.appendChild(svgEl('text', { x: cx, y: cy - 5, 'text-anchor': 'middle', fill: '#4a3a2a', 'font-size': '8', 'font-family': 'Cinzel, serif', 'pointer-events': 'none' })).textContent = 'N';
    mapSvg.appendChild(svgEl('polygon', {
      points: `${cx},${cy - 14} ${cx - 3},${cy - 4} ${cx + 3},${cy - 4}`,
      fill: '#4a3a2a', opacity: 0.6, 'pointer-events': 'none',
    }));
    mapSvg.appendChild(svgEl('polygon', {
      points: `${cx},${cy + 14} ${cx - 3},${cy + 4} ${cx + 3},${cy + 4}`,
      fill: '#8a7a5a', opacity: 0.4, 'pointer-events': 'none',
    }));
  }

  // ---- REGION UPDATE ----
  function updateRegions(gameState) {
    if (!gameState || !mapSvg) return;

    GAME.Regions.forEach(r => {
      const region = gameState.regions[r.id];
      const g = mapSvg.querySelector(`[data-region="${r.id}"]`);
      if (!g || !region) return;

      // Remove old dynamic elements
      g.querySelectorAll('.unit-display, .fellowship-marker, .control-indicator').forEach(el => el.remove());

      // Control indicator ring
      if (region.controlled) {
        const sideCol = region.controlled === 'dawn' ? '#c49a3c' : '#8b1a1a';
        const size = r.settlement === 'stronghold' ? 18 : r.settlement === 'city' ? 15 : r.settlement === 'town' ? 12 : 10;
        g.insertBefore(svgEl('circle', {
          cx: 0, cy: 0, r: size,
          fill: 'none', stroke: sideCol, 'stroke-width': 2, opacity: 0.45,
          class: 'control-indicator', 'pointer-events': 'none',
        }), g.firstChild);
      }

      // Unit count badges
      const dawnTotal = region.dawn.regular + region.dawn.elite + region.dawn.leaders + region.dawn.nazgul;
      const duskTotal = region.dusk.regular + region.dusk.elite + region.dusk.leaders + region.dusk.nazgul;

      if (dawnTotal > 0) {
        drawUnitBadge(g, dawnTotal, 'dawn', duskTotal > 0 ? -12 : -6, -22, region.dawn);
      }
      if (duskTotal > 0) {
        drawUnitBadge(g, duskTotal, 'dusk', dawnTotal > 0 ? 4 : -6, -22, region.dusk);
      }

      // Characters on map
      if (region.characters.length > 0) {
        const charStartX = -(region.characters.length * 9) / 2;
        region.characters.forEach((cid, i) => {
          const cDef = GAME.Characters[cid];
          if (!cDef) return;
          const isDawn = cDef.side === 'dawn';
          const charG = svgEl('g', {
            class: 'unit-display',
            transform: `translate(${charStartX + i * 9}, ${r.settlement ? 18 : 14})`,
            'pointer-events': 'none',
          });
          charG.appendChild(svgEl('circle', {
            cx: 4, cy: 4, r: 5,
            fill: isDawn ? '#3366cc' : '#cc3333',
            stroke: isDawn ? '#1a3366' : '#661a1a',
            'stroke-width': 1,
          }));
          const ct = svgEl('text', {
            x: 4, y: 7, 'text-anchor': 'middle',
            fill: '#fff', 'font-size': '6', 'font-weight': 'bold',
            'font-family': 'Arial',
          });
          ct.textContent = cDef.name.charAt(4) !== ' ' ? cDef.name.charAt(4) : cDef.name.charAt(0);
          charG.appendChild(ct);
          g.appendChild(charG);
        });
      }

      // Fellowship marker
      if (r.id === gameState.fellowship.position) {
        const isHidden = !gameState.fellowship.revealed;
        const fm = svgEl('g', { class: 'fellowship-marker', 'pointer-events': 'none' });

        // Outer ring
        fm.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: isHidden ? 10 : 9,
          fill: 'none',
          stroke: isHidden ? '#4488ff' : '#ffd700',
          'stroke-width': isHidden ? 1 : 2,
          'stroke-dasharray': isHidden ? '3,2' : 'none',
          opacity: isHidden ? 0.5 : 0.7,
        }));

        // Inner gem
        fm.appendChild(svgEl('circle', {
          cx: 0, cy: 0, r: 6,
          fill: isHidden ? 'rgba(68,136,255,0.6)' : '#ffd700',
          stroke: isHidden ? '#2244aa' : '#aa8800',
          'stroke-width': 1.5,
        }));

        // Star symbol
        const ft = svgEl('text', {
          x: 0, y: 3.5, 'text-anchor': 'middle',
          fill: isHidden ? '#fff' : '#2a1a0a',
          'font-size': '8', 'font-weight': 'bold',
        });
        ft.textContent = '\u2726';
        fm.appendChild(ft);

        g.appendChild(fm);
      }
    });
  }

  function drawUnitBadge(parent, total, side, offsetX, offsetY, units) {
    const isDawn = side === 'dawn';
    const bgColor = isDawn ? '#c49a3c' : '#8b1a1a';
    const borderColor = isDawn ? '#8a6a1a' : '#5a0a0a';
    const hasElite = units.elite > 0;

    const ug = svgEl('g', {
      class: 'unit-display',
      transform: `translate(${offsetX}, ${offsetY})`,
      'pointer-events': 'none',
    });

    // Badge background
    ug.appendChild(svgEl('rect', {
      x: 0, y: 0, width: 16, height: 14, rx: 3,
      fill: bgColor, stroke: borderColor, 'stroke-width': 1,
    }));

    // Elite pip
    if (hasElite) {
      ug.appendChild(svgEl('circle', {
        cx: 13, cy: 2, r: 2.5,
        fill: '#ffd700', stroke: borderColor, 'stroke-width': 0.5,
      }));
    }

    // Count text
    const ut = svgEl('text', {
      x: 8, y: 11, 'text-anchor': 'middle',
      fill: '#fff', 'font-size': '9', 'font-weight': 'bold',
      'font-family': 'Arial, sans-serif',
    });
    ut.textContent = total;
    ug.appendChild(ut);

    parent.appendChild(ug);
  }

  function highlightRegions(regionIds, color = '#ffcc00') {
    if (!mapSvg) return;
    mapSvg.querySelectorAll('.region-highlight').forEach(el => el.remove());

    regionIds.forEach(id => {
      const r = GAME.getRegion(id);
      if (!r) return;
      const g = mapSvg.querySelector(`[data-region="${id}"]`);
      if (!g) return;

      const size = r.settlement === 'stronghold' ? 22 : r.settlement === 'city' ? 18 : r.settlement === 'town' ? 14 : 12;
      const highlight = svgEl('circle', {
        cx: 0, cy: 0, r: size,
        fill: color, opacity: 0.25, stroke: color, 'stroke-width': 2.5, 'stroke-opacity': 0.6,
        class: 'region-highlight',
      });
      g.insertBefore(highlight, g.firstChild);
    });
  }

  function clearHighlights() {
    if (!mapSvg) return;
    mapSvg.querySelectorAll('.region-highlight').forEach(el => el.remove());
    mapSvg.querySelectorAll('.connection-line').forEach(el => {
      const from = el.getAttribute('data-from');
      const to = el.getAttribute('data-to');
      const inShadow = GAME.ShadowRegions.includes(from) && GAME.ShadowRegions.includes(to);
      el.setAttribute('stroke', inShadow ? '#5a3a2a' : '#8a7a60');
      el.setAttribute('opacity', inShadow ? '0.3' : '0.35');
      el.setAttribute('stroke-width', '1.2');
    });
  }

  function highlightConnections(regionId) {
    if (!mapSvg) return;
    mapSvg.querySelectorAll('.connection-line').forEach(el => {
      const from = el.getAttribute('data-from');
      const to = el.getAttribute('data-to');
      if (from === regionId || to === regionId) {
        el.setAttribute('stroke', '#ffcc00');
        el.setAttribute('opacity', '0.7');
        el.setAttribute('stroke-width', '2.5');
      }
    });
  }

  // ---- UI PANEL UPDATES ----
  function updateDiceDisplay(gameState) {
    const dawnDiceEl = document.getElementById('dawn-dice');
    const duskDiceEl = document.getElementById('dusk-dice');
    if (!dawnDiceEl || !duskDiceEl) return;

    dawnDiceEl.innerHTML = '';
    duskDiceEl.innerHTML = '';

    if (!gameState.dawnDice.length && !gameState.duskDice.length) return;

    gameState.dawnDice.forEach((die, i) => {
      dawnDiceEl.appendChild(createDieElement(die, i, 'dawn', gameState));
    });

    gameState.duskDice.forEach((die, i) => {
      duskDiceEl.appendChild(createDieElement(die, i, 'dusk', gameState));
    });
  }

  function createDieElement(die, index, side, gameState) {
    const el = document.createElement('div');
    el.className = `die ${side}-die ${die.used ? 'used' : ''} ${die.face}`;
    el.dataset.index = index;
    el.dataset.side = side;

    const icon = document.createElement('span');
    icon.className = 'die-icon';
    icon.textContent = GAME.DiceIcons[die.face] || '?';
    el.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'die-label';
    label.textContent = formatDieFace(die.face);
    el.appendChild(label);

    if (!die.used && die.face !== 'eye' &&
        gameState.activePlayer === side &&
        gameState.phase === 'action_resolution') {
      el.classList.add('selectable');
    }

    return el;
  }

  function formatDieFace(face) {
    return face.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function updateInfoPanels(gameState) {
    // Phase
    const phaseEl = document.getElementById('phase-display');
    if (phaseEl) {
      const names = {
        setup: 'Setup', fellowship_phase: 'Pilgrimage Phase',
        hunt_allocation: 'Hunt Allocation', action_roll: 'Roll Dice',
        action_resolution: 'Actions', combat: 'Combat!', game_over: 'Game Over',
      };
      phaseEl.textContent = names[gameState.phase] || gameState.phase;
    }

    // Turn
    const turnEl = document.getElementById('turn-display');
    if (turnEl) turnEl.textContent = `Turn ${gameState.turn}`;

    // Active player
    const activeEl = document.getElementById('active-player');
    if (activeEl) {
      activeEl.textContent = gameState.activePlayer === 'dawn' ? 'Dawn Covenant' : 'Dusk Dominion';
      activeEl.className = `active-player ${gameState.activePlayer}`;
    }

    // Corruption track
    const corrEl = document.getElementById('corruption-display');
    if (corrEl) {
      corrEl.innerHTML = '';
      for (let i = 0; i < 12; i++) {
        const pip = document.createElement('div');
        pip.className = `corruption-pip ${i < gameState.fellowship.corruption ? 'filled' : ''}`;
        if (i >= 8) pip.classList.add('danger');
        corrEl.appendChild(pip);
      }
      const label = document.createElement('span');
      label.className = 'corruption-label';
      label.textContent = `${gameState.fellowship.corruption}/12`;
      corrEl.appendChild(label);
    }

    // Companions
    const compEl = document.getElementById('companions-display');
    if (compEl) {
      compEl.innerHTML = '';
      gameState.fellowship.companions.forEach(cid => {
        const c = GAME.Characters[cid];
        if (!c) return;
        const chip = document.createElement('span');
        chip.className = 'companion-chip';
        chip.textContent = c.name;
        chip.title = `Level ${c.level} | ${c.ability || 'No special ability'}`;
        compEl.appendChild(chip);
      });
    }

    // Guide
    const guideEl = document.getElementById('guide-display');
    if (guideEl && gameState.fellowship.guide) {
      const guide = GAME.Characters[gameState.fellowship.guide];
      guideEl.textContent = guide ? `Guide: ${guide.name}` : '';
    }

    // Hunt box
    const huntEl = document.getElementById('hunt-box-display');
    if (huntEl) {
      huntEl.textContent = `Hunt: ${gameState.huntBox} \u25C9`;
    }

    // VP
    const dawnVP = document.getElementById('dawn-vp');
    const duskVP = document.getElementById('dusk-vp');
    if (dawnVP) dawnVP.textContent = `${gameState.dawnMilitaryVP} / ${GAME.VictoryConditions.dawnMilitaryVP} VP`;
    if (duskVP) duskVP.textContent = `${gameState.duskMilitaryVP} / ${GAME.VictoryConditions.duskMilitaryVP} VP`;

    // Dusk cards count (hidden info)
    const duskCardsEl = document.getElementById('dusk-cards-count');
    if (duskCardsEl) {
      const hand = gameState.duskHand ? gameState.duskHand.length : 0;
      duskCardsEl.textContent = `${hand} cards in hand`;
    }

    updatePoliticalDisplay(gameState);
    updateCardsDisplay(gameState);
  }

  function updatePoliticalDisplay(gameState) {
    const container = document.getElementById('political-tracks');
    if (!container) return;
    container.innerHTML = '';

    // Dawn nations first, then Dusk
    ['dawn', 'dusk'].forEach(side => {
      Object.entries(GAME.Nations).forEach(([id, n]) => {
        if (n.side !== side) return;
        const ns = gameState.nations[id];
        if (!ns) return;

        const row = document.createElement('div');
        row.className = `political-row ${n.side}`;

        const name = document.createElement('span');
        name.className = 'nation-name';
        name.style.color = n.color;
        name.textContent = n.name;
        row.appendChild(name);

        const track = document.createElement('div');
        track.className = 'political-track';
        for (let i = 0; i <= 3; i++) {
          const step = document.createElement('div');
          step.className = `political-step ${i <= ns.political ? 'active' : ''} ${i === 3 ? 'war' : ''}`;
          step.textContent = i === 3 ? '\u2694' : i;
          track.appendChild(step);
        }
        row.appendChild(track);
        container.appendChild(row);
      });
    });
  }

  function updateCardsDisplay(gameState) {
    const container = document.getElementById('dawn-cards');
    if (!container) return;
    container.innerHTML = '';

    gameState.dawnHand.forEach(cardId => {
      const card = GAME.EventCards.dawn.find(c => c.id === cardId);
      if (!card) return;

      const el = document.createElement('div');
      el.className = `card dawn-card ${card.type}`;
      el.dataset.cardId = cardId;

      const nameEl = document.createElement('div');
      nameEl.className = 'card-name';
      nameEl.textContent = card.name;
      el.appendChild(nameEl);

      const typeEl = document.createElement('div');
      typeEl.className = 'card-type';
      typeEl.textContent = card.type;
      el.appendChild(typeEl);

      const textEl = document.createElement('div');
      textEl.className = 'card-text';
      textEl.textContent = card.text;
      el.appendChild(textEl);

      container.appendChild(el);
    });
  }

  function updateLog(gameState) {
    const logEl = document.getElementById('game-log');
    if (!logEl) return;

    logEl.innerHTML = '';
    const recentLogs = gameState.log.slice(-30);
    recentLogs.forEach(entry => {
      const line = document.createElement('div');
      line.className = 'log-entry';
      // Color code certain log entries
      if (entry.msg.startsWith('---')) {
        line.classList.add('log-turn');
      } else if (entry.msg.includes('Battle') || entry.msg.includes('Combat')) {
        line.classList.add('log-combat');
      } else if (entry.msg.includes('Pilgrimage') || entry.msg.includes('Hunt')) {
        line.classList.add('log-fellowship');
      } else if (entry.msg.includes('Dawn')) {
        line.classList.add('log-dawn');
      } else if (entry.msg.includes('Dusk')) {
        line.classList.add('log-dusk');
      }
      line.textContent = entry.msg;
      logEl.appendChild(line);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ---- Action Menu ----
  function showActionMenu(actions) {
    const menu = document.getElementById('action-menu');
    if (!menu) return;
    menu.innerHTML = '';
    menu.style.display = actions.length > 0 ? 'flex' : 'none';

    const labels = {
      move_army: '\u265F Move Army',
      move_fellowship: '\u2726 Move Pilgrimage',
      move_character: '\u2694 Move Character',
      muster_troops: '\u2691 Muster Troops',
      advance_political: '\u2690 Advance Politics',
      play_event: '\u2605 Play Event',
      draw_event: '\u2605 Draw Card',
      play_character_card: '\u2605 Play Character Card',
      skip: '\u23ED Skip',
    };

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.dataset.action = action;
      btn.textContent = labels[action] || action;
      menu.appendChild(btn);
    });

    if (!actions.includes('skip')) {
      const btn = document.createElement('button');
      btn.className = 'action-btn skip-btn';
      btn.dataset.action = 'skip';
      btn.textContent = '\u23ED Skip';
      menu.appendChild(btn);
    }
  }

  function hideActionMenu() {
    const menu = document.getElementById('action-menu');
    if (menu) { menu.style.display = 'none'; menu.innerHTML = ''; }
  }

  function showPhasePrompt(text, buttons) {
    const prompt = document.getElementById('phase-prompt');
    if (!prompt) return;
    prompt.style.display = 'flex';

    const textDiv = document.createElement('div');
    textDiv.className = 'prompt-text';
    textDiv.textContent = text;

    const btnDiv = document.createElement('div');
    btnDiv.className = 'prompt-buttons';
    buttons.forEach(({ label, action, data }) => {
      const btn = document.createElement('button');
      btn.className = 'prompt-btn';
      btn.textContent = label;
      btn.dataset.action = action;
      if (data) btn.dataset.data = JSON.stringify(data);
      btnDiv.appendChild(btn);
    });

    prompt.innerHTML = '';
    prompt.appendChild(textDiv);
    prompt.appendChild(btnDiv);
  }

  function hidePhasePrompt() {
    const prompt = document.getElementById('phase-prompt');
    if (prompt) { prompt.style.display = 'none'; prompt.innerHTML = ''; }
  }

  function showCombatPanel(combatState, gameState) {
    const panel = document.getElementById('combat-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    const regionDef = GAME.getRegion(combatState.regionId);
    const region = gameState.regions[combatState.regionId];
    const atkSide = combatState.attacker;
    const defSide = combatState.defender;
    const atkName = atkSide === 'dawn' ? 'Dawn Covenant' : 'Dusk Dominion';
    const defName = defSide === 'dawn' ? 'Dawn Covenant' : 'Dusk Dominion';

    panel.innerHTML = `
      <div class="combat-header">\u2694 Battle at ${regionDef.name} ${combatState.isSiege ? '(Siege!)' : ''}</div>
      <div class="combat-forces">
        <div class="combat-side attacker ${atkSide}">
          <h4>${atkName} (Attacker)</h4>
          <div class="force-detail"><span class="force-icon">\u265F</span> Regular: ${region[atkSide].regular}</div>
          <div class="force-detail"><span class="force-icon">\u2655</span> Elite: ${region[atkSide].elite}</div>
          <div class="force-detail"><span class="force-icon">\u2694</span> Leaders: ${region[atkSide].leaders + region[atkSide].nazgul}</div>
        </div>
        <div class="combat-vs">\u2694</div>
        <div class="combat-side defender ${defSide}">
          <h4>${defName} (Defender)</h4>
          <div class="force-detail"><span class="force-icon">\u265F</span> Regular: ${region[defSide].regular}</div>
          <div class="force-detail"><span class="force-icon">\u2655</span> Elite: ${region[defSide].elite}</div>
          <div class="force-detail"><span class="force-icon">\u2694</span> Leaders: ${region[defSide].leaders + region[defSide].nazgul}</div>
        </div>
      </div>
      <div class="combat-round">Round ${combatState.round}</div>
      <div class="combat-actions">
        <button class="combat-btn" data-action="fight">\u2694 Fight!</button>
        <button class="combat-btn retreat-btn" data-action="retreat">\u2190 Retreat</button>
      </div>
    `;
  }

  function hideCombatPanel() {
    const panel = document.getElementById('combat-panel');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  }

  function showVictoryScreen(winner, reason) {
    const overlay = document.getElementById('victory-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="victory-content ${winner}">
        <h1>${winner === 'dawn' ? '\u2600 Dawn Covenant Victorious! \u2600' : '\u25C9 Dusk Dominion Triumphs! \u25C9'}</h1>
        <p>${reason}</p>
        <button onclick="location.reload()">\u21BB Play Again</button>
      </div>
    `;
  }

  function showRegionTooltip(regionId, x, y) {
    const tip = document.getElementById('region-tooltip');
    if (!tip) return;
    const state = GAME.Engine.getState();
    const regionDef = GAME.getRegion(regionId);
    const region = state.regions[regionId];
    if (!regionDef || !region) return;

    const nationDef = regionDef.nation ? GAME.Nations[regionDef.nation] : null;
    const nationState = regionDef.nation ? state.nations[regionDef.nation] : null;

    let html = `<div class="tip-name">${regionDef.name}</div>`;
    if (nationDef) {
      const warStatus = nationState && nationState.atWar ? '\u2694 At War' : `${nationState ? nationState.political : 0}/3`;
      html += `<div class="tip-nation" style="color:${nationDef.color}">${nationDef.name} (${warStatus})</div>`;
    }
    if (regionDef.settlement) {
      html += `<div class="tip-settlement">${regionDef.settlement}${regionDef.vp > 0 ? ` \u2022 ${regionDef.vp} VP` : ''}</div>`;
    }
    html += `<div class="tip-terrain">${regionDef.terrain}</div>`;

    const dawnU = region.dawn;
    const duskU = region.dusk;
    if (dawnU.regular + dawnU.elite + dawnU.leaders > 0) {
      html += `<div class="tip-dawn">\u2600 Dawn: ${dawnU.regular}R ${dawnU.elite}E ${dawnU.leaders}L</div>`;
    }
    if (duskU.regular + duskU.elite + duskU.leaders + duskU.nazgul > 0) {
      html += `<div class="tip-dusk">\u25C9 Dusk: ${duskU.regular}R ${duskU.elite}E ${duskU.leaders}L${duskU.nazgul > 0 ? ' ' + duskU.nazgul + 'S' : ''}</div>`;
    }

    if (region.characters.length > 0) {
      const names = region.characters.map(cid => GAME.Characters[cid] ? GAME.Characters[cid].name : cid).join(', ');
      html += `<div class="tip-chars">\u2694 ${names}</div>`;
    }

    if (regionId === state.fellowship.position) {
      html += `<div class="tip-fellowship">\u2726 Pilgrimage is here${state.fellowship.revealed ? '' : ' (hidden)'}</div>`;
    }

    tip.innerHTML = html;
    tip.style.display = 'block';

    // Position tooltip avoiding edges
    const mapRect = document.getElementById('map-container').getBoundingClientRect();
    let tipX = x + 15;
    let tipY = y - 10;
    if (tipX + 200 > mapRect.width) tipX = x - 200;
    if (tipY + 150 > mapRect.height) tipY = mapRect.height - 155;
    if (tipY < 0) tipY = 5;

    tip.style.left = tipX + 'px';
    tip.style.top = tipY + 'px';
  }

  function hideRegionTooltip() {
    const tip = document.getElementById('region-tooltip');
    if (tip) tip.style.display = 'none';
  }

  function fullUpdate(gameState) {
    if (!gameState) return;
    updateRegions(gameState);
    updateDiceDisplay(gameState);
    updateInfoPanels(gameState);
    updateLog(gameState);
  }

  // SVG element helper
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  return {
    init, drawMap, updateRegions, highlightRegions, clearHighlights,
    highlightConnections, updateDiceDisplay, updateInfoPanels, updateLog,
    showActionMenu, hideActionMenu, showPhasePrompt, hidePhasePrompt,
    showCombatPanel, hideCombatPanel, showVictoryScreen,
    showRegionTooltip, hideRegionTooltip, fullUpdate,
  };
})();
