/**
 * robot-game.js
 * Block-based robot maze game using canvas.
 */

(function(global) {
  'use strict';

  const CELL = 56;
  const GRID = 8;
  const MAX_STEPS = 200;

  const DIR = { RIGHT: 0, DOWN: 1, LEFT: 2, UP: 3 };
  const DIR_DX = [1, 0, -1, 0];
  const DIR_DY = [0, 1, 0, -1];

  // ── Level definitions ──
  const LEVELS = [
    {
      title: 'Level 1 — Straight Line',
      hint: 'Use a for loop to repeat move_forward. Count the squares to the flag.',
      startX: 0, startY: 0, startDir: DIR.RIGHT,
      flagX: 5, flagY: 0,
      walls: [],
    },
    {
      title: 'Level 2 — L-Shape',
      hint: 'You need two groups of moves with a turn between them. Try: for range(3) move, then turn_right, then for range(4) move.',
      startX: 0, startY: 0, startDir: DIR.RIGHT,
      flagX: 3, flagY: 4,
      walls: [],
    },
    {
      title: 'Level 3 — Maze',
      hint: 'Use "while not robot.at_flag():" with "if robot.wall_ahead():" → turn_right inside, then move_forward. The robot spirals through the corridors! Use ◀▶ to fix indentation.',
      startX: 0, startY: 0, startDir: DIR.RIGHT,
      flagX: 4, flagY: 2,
      // Clockwise spiral: right along row 0, down, left along row 4, up, right to flag
      walls: [
        // Functional walls (define the spiral path)
        { x: 5, y: 0, side: 'E' },   // forces right→down turn at (5,0)
        { x: 5, y: 4, side: 'S' },   // forces down→left turn at (5,4)
        { x: 1, y: 4, side: 'E' },   // forces left→up turn at (2,4)
        { x: 2, y: 2, side: 'N' },   // forces up→right turn at (2,2)
        // Decorative walls (make it look like a maze)
        { x: 0, y: 1, side: 'E' },
        { x: 3, y: 1, side: 'S' },
        { x: 6, y: 2, side: 'S' },
        { x: 7, y: 3, side: 'W' },
        { x: 0, y: 5, side: 'S' },
        { x: 3, y: 5, side: 'E' },
        { x: 6, y: 5, side: 'S' },
        { x: 4, y: 6, side: 'E' },
      ],
    },
  ];

  // ── Available code blocks ──
  // isContainer means the next block added auto-indents +1
  const BLOCK_DEFS = [
    { id: 'for_range',  label: 'for i in range(__)',       template: 'for_range',  hasNum: true,  isContainer: true },
    { id: 'while_flag', label: 'while not robot.at_flag():', template: 'while_flag', hasNum: false, isContainer: true },
    { id: 'move',       label: 'robot.move_forward()',     template: 'move',       hasNum: false, isContainer: false },
    { id: 'turn_left',  label: 'robot.turn_left()',        template: 'turn_left',  hasNum: false, isContainer: false },
    { id: 'turn_right', label: 'robot.turn_right()',       template: 'turn_right', hasNum: false, isContainer: false },
    { id: 'if_wall',    label: 'if robot.wall_ahead():',   template: 'if_wall',    hasNum: false, isContainer: true },
    { id: 'break',      label: 'break',                    template: 'break',      hasNum: false, isContainer: false },
  ];

  class RobotGame {
    constructor(canvasEl, codeAreaEl, config) {
      this.canvas = canvasEl;
      this.ctx    = canvasEl.getContext('2d');
      this.codeArea = codeAreaEl;
      this.config = config || {};

      this.currentLevel = 0;
      this.completedLevels = new Set();
      this.sequence = [];
      this.trail = [];

      this._animTimer  = null;
      this._shakeTimer = null;
      this._shakeOffset = 0;

      this._setupCanvas();
      this._buildUI();
      this.loadLevel(0);
    }

    _setupCanvas() {
      const size = CELL * GRID;
      this.canvas.width  = size;
      this.canvas.height = size;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height   = 'auto';
    }

    _buildUI() {
      this.codeArea.innerHTML = '';

      // Palette
      const palette = document.createElement('div');
      palette.className = 'code-blocks-area';
      palette.setAttribute('aria-label', 'Available code blocks');
      BLOCK_DEFS.forEach(def => {
        const block = document.createElement('div');
        block.className = 'code-block-item';
        block.dataset.blockId = def.id;
        block.textContent = def.label;
        block.setAttribute('tabindex', '0');
        block.addEventListener('click', () => this._addToSequence(def));
        block.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._addToSequence(def); }
        });
        palette.appendChild(block);
      });
      this.codeArea.appendChild(palette);

      // Label
      const seqLabel = document.createElement('div');
      seqLabel.style.cssText = 'font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:0.75rem 0 0.25rem;';
      seqLabel.textContent = 'Your Code (click to add, \u25C0\u25B6 to adjust indent, \u00D7 to remove)';
      this.codeArea.appendChild(seqLabel);

      // Sequence area
      this.seqEl = document.createElement('div');
      this.seqEl.className = 'sequence-area';
      this.seqEl.setAttribute('aria-label', 'Code sequence');
      this._showPlaceholder();
      this.codeArea.appendChild(this.seqEl);

      // Controls
      const controls = document.createElement('div');
      controls.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;align-items:center;';

      this.runBtn   = this._mkBtn('\u25B6 Run', 'btn btn-primary btn-sm', () => this.run());
      this.resetBtn = this._mkBtn('\u21BA Reset', 'btn btn-ghost btn-sm', () => this.resetRobot());
      this.hintBtn  = this._mkBtn('? Hint', 'btn btn-outline btn-sm', () => this._showHint());
      this.clearBtn = this._mkBtn('Clear Code', 'btn btn-ghost btn-sm', () => this._clearSequence());

      controls.appendChild(this.runBtn);
      controls.appendChild(this.resetBtn);
      controls.appendChild(this.hintBtn);
      controls.appendChild(this.clearBtn);
      this.codeArea.appendChild(controls);

      // Message area
      this.msgEl = document.createElement('div');
      this.msgEl.style.cssText = 'min-height:2rem;margin-top:0.5rem;font-size:0.9rem;';
      this.codeArea.appendChild(this.msgEl);

      // Hint area
      this.hintEl = document.createElement('div');
      this.hintEl.className = 'concept-box hidden';
      this.hintEl.style.marginTop = '0.5rem';
      this.codeArea.appendChild(this.hintEl);
    }

    _mkBtn(label, cls, handler) {
      const b = document.createElement('button');
      b.className = cls;
      b.innerHTML = label;
      b.addEventListener('click', handler);
      return b;
    }

    _showPlaceholder() {
      const ph = document.createElement('div');
      ph.id = 'seq-placeholder';
      ph.className = 'text-muted text-sm';
      ph.style.fontStyle = 'italic';
      ph.textContent = 'Click blocks above to add them here\u2026';
      this.seqEl.appendChild(ph);
    }

    // ── Sequence management ──

    _addToSequence(def) {
      const ph = document.getElementById('seq-placeholder');
      if (ph) ph.remove();

      // Calculate indent from context: after a container block, auto-indent +1
      const existing = Array.from(this.seqEl.querySelectorAll('.seq-block'));
      let indent = 0;
      if (existing.length > 0) {
        const last = existing[existing.length - 1];
        const lastIndent = parseInt(last.dataset.indent || '0');
        const lastDef = BLOCK_DEFS.find(b => b.template === last.dataset.template);
        indent = (lastDef && lastDef.isContainer) ? lastIndent + 1 : lastIndent;
      }

      const row = document.createElement('div');
      row.className = 'seq-block indent-' + indent;
      row.dataset.template = def.template;
      row.dataset.indent   = indent;

      // Code display
      const codeSpan = document.createElement('span');
      codeSpan.style.flex = '1';

      if (def.hasNum) {
        const numInput = document.createElement('input');
        numInput.type = 'number';
        numInput.value = '5';
        numInput.min = '1';
        numInput.max = '20';
        numInput.style.cssText = 'width:48px;background:#0f172a;border:1px solid #475569;color:#fbbf24;font-family:var(--font-code);font-size:0.85rem;border-radius:4px;padding:1px 4px;text-align:center;';
        codeSpan.innerHTML = '<span class="kw">for</span> i <span class="kw">in</span> <span class="builtin">range</span>(';
        codeSpan.appendChild(numInput);
        const close = document.createElement('span');
        close.textContent = '):';
        codeSpan.appendChild(close);
      } else {
        const displays = {
          while_flag: '<span class="kw">while not</span> robot.at_flag():',
          move:       'robot.move_forward()',
          turn_left:  'robot.turn_left()',
          turn_right: 'robot.turn_right()',
          if_wall:    '<span class="kw">if</span> robot.wall_ahead():',
          break:      '<span class="kw">break</span>',
        };
        codeSpan.innerHTML = displays[def.template] || def.label;
      }
      row.appendChild(codeSpan);

      // Drag handle for reordering
      const handle = document.createElement('span');
      handle.className = 'seq-drag-handle';
      handle.textContent = '\u2261';
      handle.title = 'Hold and drag to reorder';
      row.insertBefore(handle, codeSpan);
      this._setupReorder(row, handle);

      // Indent / outdent buttons
      const btnGroup = document.createElement('span');
      btnGroup.style.cssText = 'display:inline-flex;gap:2px;margin-left:0.3rem;';

      const outdentBtn = document.createElement('button');
      outdentBtn.className = 'remove-btn';
      outdentBtn.textContent = '\u25C0';
      outdentBtn.title = 'Decrease indent';
      outdentBtn.addEventListener('click', () => this._changeIndent(row, -1));

      const indentBtn = document.createElement('button');
      indentBtn.className = 'remove-btn';
      indentBtn.textContent = '\u25B6';
      indentBtn.title = 'Increase indent';
      indentBtn.addEventListener('click', () => this._changeIndent(row, 1));

      btnGroup.appendChild(outdentBtn);
      btnGroup.appendChild(indentBtn);
      row.appendChild(btnGroup);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '\u00D7';
      removeBtn.setAttribute('aria-label', 'Remove block');
      removeBtn.addEventListener('click', () => {
        row.remove();
        if (this.seqEl.querySelectorAll('.seq-block').length === 0) {
          this._showPlaceholder();
        }
        this._updateSequence();
      });
      row.appendChild(removeBtn);

      this.seqEl.appendChild(row);
      this._updateSequence();
    }

    _changeIndent(row, delta) {
      const current = parseInt(row.dataset.indent || '0');
      const next = Math.max(0, Math.min(3, current + delta));
      row.dataset.indent = next;
      row.className = 'seq-block indent-' + next;
      this._updateSequence();
    }

    // ── Drag-to-reorder within sequence area ──

    _setupReorder(row, handle) {
      const self = this;
      let dragging = false;
      let ghost = null;
      let indicator = null;
      let startY = 0;

      const onPointerDown = function(e) {
        // Only trigger on the handle itself
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        dragging = true;
        startY = e.clientY;

        // Create ghost (semi-transparent clone)
        ghost = row.cloneNode(true);
        ghost.className = 'seq-block-ghost';
        ghost.style.cssText = 'position:fixed;pointer-events:none;opacity:0.7;z-index:1000;' +
          'left:' + row.getBoundingClientRect().left + 'px;' +
          'width:' + row.getBoundingClientRect().width + 'px;' +
          'top:' + row.getBoundingClientRect().top + 'px;' +
          'background:var(--color-code-bg);color:var(--color-code-text);font-family:var(--font-code);' +
          'font-size:0.88rem;padding:0.35rem 0.75rem;border-radius:6px;border:2px solid var(--color-primary);';
        document.body.appendChild(ghost);

        // Create drop indicator line
        indicator = document.createElement('div');
        indicator.className = 'seq-drop-indicator';
        self.seqEl.appendChild(indicator);

        row.style.opacity = '0.25';
      };

      const onPointerMove = function(e) {
        if (!dragging) return;
        e.preventDefault();

        // Move ghost
        if (ghost) {
          ghost.style.top = e.clientY - 16 + 'px';
        }

        // Find drop position
        const blocks = Array.from(self.seqEl.querySelectorAll('.seq-block'));
        let insertBefore = null;
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          if (b === row) continue;
          var rect = b.getBoundingClientRect();
          var midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            insertBefore = b;
            break;
          }
        }

        // Position indicator
        if (indicator) {
          if (insertBefore) {
            var r = insertBefore.getBoundingClientRect();
            var containerRect = self.seqEl.getBoundingClientRect();
            indicator.style.top = (r.top - containerRect.top - 2) + 'px';
            indicator.style.display = 'block';
          } else {
            // After last block
            var lastBlock = blocks.filter(function(b) { return b !== row; }).pop();
            if (lastBlock) {
              var r = lastBlock.getBoundingClientRect();
              var containerRect = self.seqEl.getBoundingClientRect();
              indicator.style.top = (r.bottom - containerRect.top) + 'px';
            }
            indicator.style.display = 'block';
          }
        }

        // Store the target for pointerup
        handle._insertBefore = insertBefore;
      };

      const onPointerUp = function(e) {
        if (!dragging) return;
        dragging = false;

        // Clean up ghost and indicator
        if (ghost) { ghost.remove(); ghost = null; }
        if (indicator) { indicator.remove(); indicator = null; }
        row.style.opacity = '';

        // Reorder
        var target = handle._insertBefore;
        if (target && target !== row) {
          self.seqEl.insertBefore(row, target);
        } else if (target === null || target === undefined) {
          // Move to end (but only if we actually moved)
          self.seqEl.appendChild(row);
        }
        handle._insertBefore = undefined;
        self._updateSequence();
      };

      handle.addEventListener('pointerdown', onPointerDown);
      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    }

    _updateSequence() {
      this.sequence = [];
      Array.from(this.seqEl.querySelectorAll('.seq-block')).forEach(row => {
        const template = row.dataset.template;
        const indent   = parseInt(row.dataset.indent || '0');
        let num = 5;
        const ni = row.querySelector('input[type=number]');
        if (ni) num = parseInt(ni.value) || 5;
        this.sequence.push({ template, num, indent });
      });
    }

    _clearSequence() {
      this.seqEl.innerHTML = '';
      this._showPlaceholder();
      this.sequence = [];
    }

    _showHint() {
      const level = LEVELS[this.currentLevel];
      this.hintEl.textContent = level.hint;
      this.hintEl.classList.toggle('hidden');
    }

    // ── Level loading ──

    loadLevel(idx) {
      this._stopAnimations();
      this.currentLevel = idx;
      const level = LEVELS[idx];
      this.robotX   = level.startX;
      this.robotY   = level.startY;
      this.robotDir = level.startDir;
      this.trail    = [];
      this.msgEl.textContent = '';
      this.msgEl.style.color = '';
      this.hintEl.classList.add('hidden');
      this.draw();
    }

    resetRobot() {
      this._stopAnimations();
      const level = LEVELS[this.currentLevel];
      this.robotX   = level.startX;
      this.robotY   = level.startY;
      this.robotDir = level.startDir;
      this.trail    = [];
      this.msgEl.textContent = '';
      this.msgEl.style.color = '';
      this.draw();
    }

    _stopAnimations() {
      if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = null; }
      if (this._shakeTimer) { cancelAnimationFrame(this._shakeTimer); this._shakeTimer = null; }
      this._shakeOffset = 0;
    }

    // ── Code execution ──

    run() {
      if (this._animTimer) return;
      this._updateSequence();
      this.resetRobot();

      if (this.sequence.length === 0) {
        this.msgEl.textContent = 'Add some code blocks first!';
        this.msgEl.style.color = 'var(--color-secondary)';
        return;
      }

      try {
        const moves = this._executeSequence();
        this._animateMoves(moves);
      } catch (e) {
        this.msgEl.textContent = e.message;
        this.msgEl.style.color = 'var(--color-error)';
      }
    }

    _executeSequence() {
      const level = LEVELS[this.currentLevel];
      const sim = {
        x: level.startX, y: level.startY, dir: level.startDir,
        steps: 0,
        moves: [],
        walls: level.walls
      };

      const save = function(type) {
        sim.moves.push({ x: sim.x, y: sim.y, dir: sim.dir, type: type || 'move' });
      };

      const robot = {
        move_forward: function() {
          if (sim.steps++ > MAX_STEPS) throw new Error('Too many steps! (max 200) — check for infinite loops.');
          var nx = sim.x + DIR_DX[sim.dir];
          var ny = sim.y + DIR_DY[sim.dir];
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
            save('collision');
            throw new Error('Oops! The robot hit the boundary.');
          }
          if (hasWall(sim, sim.dir)) {
            save('collision');
            throw new Error('Oops! The robot ran into a wall.');
          }
          sim.x = nx;
          sim.y = ny;
          save('move');
        },
        turn_left: function() {
          sim.dir = (sim.dir + 3) % 4;
          save('turn');
        },
        turn_right: function() {
          sim.dir = (sim.dir + 1) % 4;
          save('turn');
        },
        wall_ahead: function() {
          var nx = sim.x + DIR_DX[sim.dir];
          var ny = sim.y + DIR_DY[sim.dir];
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) return true;
          return hasWall(sim, sim.dir);
        },
        at_flag: function() {
          return sim.x === level.flagX && sim.y === level.flagY;
        },
      };

      // Record initial position
      save('move');

      // Interpret the block sequence
      this._interpSequence(this.sequence, robot, sim);
      return sim.moves;
    }

    _interpSequence(seq, robot, sim) {
      var i = 0;
      while (i < seq.length) {
        var block = seq[i];
        if (sim.steps > MAX_STEPS) throw new Error('Too many steps! (max 200) — check for infinite loops.');

        if (block.template === 'for_range') {
          var body = this._collectBody(seq, i);
          try {
            for (var n = 0; n < (block.num || 5); n++) {
              if (sim.steps > MAX_STEPS) throw new Error('Too many steps! (max 200) — check for infinite loops.');
              this._interpSequence(body, robot, sim);
            }
          } catch (e) {
            if (!(e instanceof BreakSignal)) throw e;
          }
          i += body.length + 1;

        } else if (block.template === 'while_flag') {
          var body = this._collectBody(seq, i);
          var safety = 0;
          try {
            while (!robot.at_flag() && safety++ < MAX_STEPS) {
              if (sim.steps > MAX_STEPS) throw new Error('Too many steps! (max 200) — check for infinite loops.');
              this._interpSequence(body, robot, sim);
            }
          } catch (e) {
            if (!(e instanceof BreakSignal)) throw e;
          }
          i += body.length + 1;

        } else if (block.template === 'if_wall') {
          var body = this._collectBody(seq, i);
          if (robot.wall_ahead()) {
            this._interpSequence(body, robot, sim);
          }
          i += body.length + 1;

        } else if (block.template === 'move') {
          robot.move_forward();
          i++;
        } else if (block.template === 'turn_left') {
          robot.turn_left();
          i++;
        } else if (block.template === 'turn_right') {
          robot.turn_right();
          i++;
        } else if (block.template === 'break') {
          throw new BreakSignal();
        } else {
          i++;
        }
      }
    }

    _collectBody(seq, parentIdx) {
      var parentIndent = seq[parentIdx].indent;
      var body = [];
      for (var j = parentIdx + 1; j < seq.length; j++) {
        if (seq[j].indent > parentIndent) {
          body.push(seq[j]);
        } else {
          break;
        }
      }
      return body;
    }

    // ── Animation ──

    _animateMoves(moves) {
      var level = LEVELS[this.currentLevel];
      this.trail = [];
      var idx = 0;
      var self = this;

      var animate = function() {
        if (idx >= moves.length) {
          var last = moves[moves.length - 1];
          if (last && last.x === level.flagX && last.y === level.flagY) {
            self._celebrate();
          }
          self._animTimer = null;
          return;
        }

        var m = moves[idx];
        self.robotX   = m.x;
        self.robotY   = m.y;
        self.robotDir = m.dir;

        // Record trail (unique positions only)
        if (m.type === 'move' || m.type === 'turn') {
          if (!self.trail.some(function(t) { return t.x === m.x && t.y === m.y; })) {
            self.trail.push({ x: m.x, y: m.y });
          }
        }

        if (m.type === 'collision') {
          self._shakeRobot();
          self.msgEl.textContent = 'Oops! The robot crashed.';
          self.msgEl.style.color = 'var(--color-error)';
          self._animTimer = null;
          return;
        }

        self.draw();
        idx++;
        self._animTimer = setTimeout(animate, 180);
      };
      animate();
    }

    _shakeRobot() {
      var self = this;
      var start = performance.now();
      var duration = 500;

      var frame = function(now) {
        var elapsed = now - start;
        if (elapsed > duration) {
          self._shakeOffset = 0;
          self._shakeTimer = null;
          self.draw();
          return;
        }
        var decay = 1 - elapsed / duration;
        self._shakeOffset = Math.sin(elapsed / 25) * 5 * decay;
        self.draw(true);
        self._shakeTimer = requestAnimationFrame(frame);
      };
      this._shakeTimer = requestAnimationFrame(frame);
    }

    _celebrate() {
      this.completedLevels.add(this.currentLevel);
      this.msgEl.innerHTML = '<span style="color:var(--color-success);font-weight:600;">\uD83C\uDF89 Level ' + (this.currentLevel + 1) + ' complete!</span>';

      if (this.config.onLevelComplete) {
        this.config.onLevelComplete(this.currentLevel);
      }
    }

    // ── Drawing ──

    draw(isShaking) {
      var ctx = this.ctx;
      var level = LEVELS[this.currentLevel];

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Grid cells
      for (var row = 0; row < GRID; row++) {
        for (var col = 0; col < GRID; col++) {
          var cx = col * CELL;
          var cy = row * CELL;
          ctx.fillStyle = (row + col) % 2 === 0 ? '#1e293b' : '#172033';
          ctx.fillRect(cx, cy, CELL, CELL);
        }
      }

      // Trail (visited cells get a faded blue dot)
      for (var t = 0; t < this.trail.length; t++) {
        var tx = this.trail[t].x * CELL + CELL / 2;
        var ty = this.trail[t].y * CELL + CELL / 2;
        ctx.beginPath();
        ctx.arc(tx, ty, CELL * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
        ctx.fill();
      }

      // Grid lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (var i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, GRID * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(GRID * CELL, i * CELL);
        ctx.stroke();
      }

      // Walls
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (var wi = 0; wi < level.walls.length; wi++) {
        var w = level.walls[wi];
        var wx = w.x * CELL;
        var wy = w.y * CELL;
        ctx.beginPath();
        if (w.side === 'E') { ctx.moveTo(wx + CELL, wy); ctx.lineTo(wx + CELL, wy + CELL); }
        if (w.side === 'S') { ctx.moveTo(wx, wy + CELL); ctx.lineTo(wx + CELL, wy + CELL); }
        if (w.side === 'W') { ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + CELL); }
        if (w.side === 'N') { ctx.moveTo(wx, wy); ctx.lineTo(wx + CELL, wy); }
        ctx.stroke();
      }

      // Flag
      var fx = level.flagX * CELL + CELL / 2;
      var fy = level.flagY * CELL + CELL / 2;
      ctx.font = (CELL * 0.55) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uD83C\uDFC1', fx, fy);

      // Robot
      var rx = this.robotX * CELL + CELL / 2;
      var ry = this.robotY * CELL + CELL / 2;
      var R  = CELL * 0.35;

      ctx.save();
      if (isShaking) {
        rx += this._shakeOffset || 0;
      }
      ctx.translate(rx, ry);

      // Body circle
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = isShaking ? '#ef4444' : '#2563eb';
      ctx.fill();
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Direction arrow
      var angle = this.robotDir * Math.PI / 2;
      ctx.rotate(angle);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(R * 0.55, 0);
      ctx.lineTo(-R * 0.3, -R * 0.3);
      ctx.lineTo(-R * 0.3,  R * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // ── Wall collision helper ──
  function hasWall(sim, dir) {
    for (var i = 0; i < sim.walls.length; i++) {
      var w = sim.walls[i];
      // Wall on the side of the current cell
      if (dir === DIR.RIGHT && w.side === 'E' && w.x === sim.x && w.y === sim.y) return true;
      if (dir === DIR.LEFT  && w.side === 'W' && w.x === sim.x && w.y === sim.y) return true;
      if (dir === DIR.DOWN  && w.side === 'S' && w.x === sim.x && w.y === sim.y) return true;
      if (dir === DIR.UP    && w.side === 'N' && w.x === sim.x && w.y === sim.y) return true;
      // Wall on the adjoining side of the neighbour cell
      if (dir === DIR.RIGHT && w.side === 'W' && w.x === sim.x + 1 && w.y === sim.y) return true;
      if (dir === DIR.LEFT  && w.side === 'E' && w.x === sim.x - 1 && w.y === sim.y) return true;
      if (dir === DIR.DOWN  && w.side === 'N' && w.x === sim.x     && w.y === sim.y + 1) return true;
      if (dir === DIR.UP    && w.side === 'S' && w.x === sim.x     && w.y === sim.y - 1) return true;
    }
    return false;
  }

  // ── Break signal (used by the interpreter) ──
  class BreakSignal extends Error {
    constructor() { super('break'); }
  }

  global.RobotGame = RobotGame;

})(window);
