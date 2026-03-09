/**
 * step-through.js
 * Class StepThrough — animates Python execution traces.
 */

(function(global) {
  'use strict';

  class StepThrough {
    /**
     * @param {HTMLElement} containerEl — the host element
     * @param {Object} config
     *   config.code          {string[]}  — array of source lines
     *   config.steps         {Object[]}  — execution trace
     *   config.showFlowArrows {boolean}
     *   config.title         {string}    — optional panel title
     */
    constructor(containerEl, config) {
      this.container      = containerEl;
      this.code           = config.code || [];
      this.steps          = config.steps || [];
      this.showFlowArrows = config.showFlowArrows !== false;
      this.title          = config.title || '';

      this._currentStep   = -1;
      this._variables     = {};
      this._output        = '';
      this._timer         = null;

      this._render();
    }

    /* ─── Private: render skeleton ─────────────────────────────── */
    _render() {
      this.container.innerHTML = '';

      if (this.title) {
        const t = document.createElement('div');
        t.className = 'card-title';
        t.textContent = this.title;
        this.container.appendChild(t);
      }

      // Main layout
      const layout = document.createElement('div');
      layout.className = 'step-through-container';

      // Code panel
      this._codePanel = document.createElement('div');
      this._codePanel.className = 'st-code-panel';
      this._buildCodePanel();
      layout.appendChild(this._codePanel);

      // Right panel
      const right = document.createElement('div');
      right.className = 'st-right-panel';

      // Variable watch
      const varWrap = document.createElement('div');
      varWrap.className = 'var-watch';
      const varTitle = document.createElement('div');
      varTitle.className = 'var-watch-title';
      varTitle.textContent = 'Variables';
      this._varTable = document.createElement('table');
      this._varTable.className = 'var-table';
      varWrap.appendChild(varTitle);
      varWrap.appendChild(this._varTable);
      right.appendChild(varWrap);

      // Console
      const conWrap = document.createElement('div');
      const conTitle = document.createElement('div');
      conTitle.className = 'var-watch-title';
      conTitle.style.marginBottom = '0.4rem';
      conTitle.textContent = 'Console Output';
      this._consoleEl = document.createElement('div');
      this._consoleEl.className = 'console-output';
      this._consoleEl.style.minHeight = '80px';
      conWrap.appendChild(conTitle);
      conWrap.appendChild(this._consoleEl);
      right.appendChild(conWrap);

      // Step info
      this._infoEl = document.createElement('div');
      this._infoEl.className = 'text-sm text-muted';
      this._infoEl.style.minHeight = '1.5rem';
      right.appendChild(this._infoEl);

      layout.appendChild(right);
      this.container.appendChild(layout);

      // Controls
      const controls = document.createElement('div');
      controls.className = 'st-controls mt-2';

      this._stepBtn = this._makeBtn('Step →', 'btn btn-primary btn-sm', () => this.step());
      this._runBtn  = this._makeBtn('Run All', 'btn btn-ghost btn-sm', () => this.runAll(500));
      this._resetBtn = this._makeBtn('Reset', 'btn btn-outline btn-sm', () => this.reset());

      controls.appendChild(this._stepBtn);
      controls.appendChild(this._runBtn);
      controls.appendChild(this._resetBtn);
      this.container.appendChild(controls);

      this._updateControls();
    }

    _makeBtn(label, cls, handler) {
      const b = document.createElement('button');
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', handler);
      return b;
    }

    _buildCodePanel() {
      this._codePanel.innerHTML = '';
      this._lineEls = [];
      this.code.forEach((line, idx) => {
        const row = document.createElement('div');
        row.className = 'st-code-line';

        const num = document.createElement('span');
        num.className = 'st-line-num';
        num.textContent = idx + 1;

        const code = document.createElement('span');
        code.className = 'st-code-text';
        code.innerHTML = typeof highlightPython === 'function'
          ? highlightPython(line)
          : line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        // Badge slot
        const badge = document.createElement('span');
        badge.className = 'condition-badge-slot';

        row.appendChild(num);
        row.appendChild(code);
        row.appendChild(badge);

        this._codePanel.appendChild(row);
        this._lineEls.push(row);
      });
    }

    /* ─── Private: update display ────────────────────────────────── */
    _applyStep(step) {
      // Deactivate all lines
      this._lineEls.forEach(el => {
        el.classList.remove('active');
        const slot = el.querySelector('.condition-badge-slot');
        if (slot) slot.innerHTML = '';
        const arrow = el.querySelector('.flow-arrow');
        if (arrow) arrow.remove();
      });

      if (step === null) return;

      const { lineIndex, variables, output, conditionBadge, flowArrow } = step;

      // Highlight current line
      if (lineIndex >= 0 && lineIndex < this._lineEls.length) {
        const el = this._lineEls[lineIndex];
        el.classList.add('active');

        // Condition badge
        if (conditionBadge) {
          const isTrue = /→\s*True/i.test(conditionBadge);
          const slot = el.querySelector('.condition-badge-slot');
          if (slot) {
            const badge = document.createElement('span');
            badge.className = `condition-badge ${isTrue ? 'true-badge' : 'false-badge'}`;
            badge.textContent = conditionBadge;
            slot.appendChild(badge);
          }
        }

        // Flow arrows
        if (this.showFlowArrows && flowArrow) {
          const arrow = document.createElement('span');
          arrow.className = `flow-arrow flow-${flowArrow}`;
          arrow.textContent = flowArrow === 'break' ? '→ EXIT' : '↑ SKIP';
          el.appendChild(arrow);
        }

        // Scroll into view if needed
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      // Update variables
      if (variables) {
        this._variables = Object.assign({}, this._variables, variables);
      }
      this._renderVars();

      // Append output
      if (output !== undefined && output !== null) {
        this._output += output + '\n';
        this._consoleEl.textContent = this._output;
        this._consoleEl.scrollTop = this._consoleEl.scrollHeight;
      }

      // Info text
      const n = this._currentStep + 1;
      const total = this.steps.length;
      this._infoEl.textContent = `Step ${n} of ${total}`;
    }

    _renderVars() {
      this._varTable.innerHTML = '';
      const entries = Object.entries(this._variables);
      if (entries.length === 0) {
        const row = this._varTable.insertRow();
        const td = row.insertCell();
        td.colSpan = 3;
        td.className = 'text-muted';
        td.style.fontStyle = 'italic';
        td.style.fontSize = '0.8rem';
        td.textContent = '(no variables yet)';
        return;
      }
      entries.forEach(([name, val]) => {
        const row = this._varTable.insertRow();
        row.insertCell().outerHTML = `<td class="var-name">${escHtml(String(name))}</td>`;
        row.insertCell().outerHTML = `<td class="var-eq">&nbsp;=&nbsp;</td>`;
        row.insertCell().outerHTML = `<td class="var-val">${escHtml(String(val))}</td>`;
      });
    }

    _updateControls() {
      const done = this._currentStep >= this.steps.length - 1;
      if (this._stepBtn) this._stepBtn.disabled = done || !!this._timer;
      if (this._runBtn)  this._runBtn.disabled  = done || !!this._timer;
      if (this._resetBtn) this._resetBtn.disabled = !!this._timer;
    }

    /* ─── Public API ─────────────────────────────────────────────── */
    step() {
      if (this._currentStep >= this.steps.length - 1) return;
      this._currentStep++;
      this._applyStep(this.steps[this._currentStep]);
      this._updateControls();
    }

    runAll(speedMs = 500) {
      if (this._timer) return;
      this._updateControls();
      const tick = () => {
        if (this._currentStep >= this.steps.length - 1) {
          this._timer = null;
          this._updateControls();
          return;
        }
        this.step();
        this._timer = setTimeout(tick, speedMs);
      };
      this._timer = setTimeout(tick, 0);
    }

    reset() {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      this._currentStep = -1;
      this._variables   = {};
      this._output      = '';
      this._consoleEl.textContent = '';
      this._infoEl.textContent = '';
      this._applyStep(null);
      this._renderVars();
      this._updateControls();
    }

    /** Replace code + steps and re-render */
    reconfigure(config) {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      this.code  = config.code  || this.code;
      this.steps = config.steps || this.steps;
      this._currentStep = -1;
      this._variables   = {};
      this._output      = '';
      this._buildCodePanel();
      this._consoleEl.textContent = '';
      this._infoEl.textContent = '';
      this._renderVars();
      this._updateControls();
    }
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  global.StepThrough = StepThrough;

})(window);
