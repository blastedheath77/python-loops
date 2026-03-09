/**
 * drag-drop.js
 * Pointer-event-based drag-and-drop utility.
 * Touch-friendly, no external dependencies.
 */

(function(global) {
  'use strict';

  class DragDrop {
    constructor() {
      this._dragging = null;
      this._ghost = null;
      this._offsetX = 0;
      this._offsetY = 0;
      this._dropZones = [];
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp   = this._onPointerUp.bind(this);
    }

    /**
     * Make an element draggable.
     * @param {HTMLElement} el
     * @param {Object} [opts]
     *   opts.data — arbitrary data attached to the drag event
     *   opts.ghostClass — extra CSS class on ghost
     */
    makeDraggable(el, opts = {}) {
      el.classList.add('draggable');
      el.setAttribute('draggable', 'false'); // disable native dnd

      el.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();

        this._dragging = el;
        this._draggingData = opts.data || null;

        el.classList.add('dragging');
        el.setPointerCapture(e.pointerId);

        // Create ghost
        const rect = el.getBoundingClientRect();
        this._offsetX = e.clientX - rect.left;
        this._offsetY = e.clientY - rect.top;

        const ghost = el.cloneNode(true);
        ghost.style.cssText = `
          position: fixed;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          opacity: 0.85;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          transform: rotate(1.5deg) scale(1.03);
          transition: transform 0.1s;
        `;
        if (opts.ghostClass) ghost.classList.add(opts.ghostClass);
        document.body.appendChild(ghost);
        this._ghost = ghost;

        document.addEventListener('pointermove', this._onPointerMove);
        document.addEventListener('pointerup',   this._onPointerUp);
      });
    }

    _onPointerMove(e) {
      if (!this._ghost) return;
      this._ghost.style.left = (e.clientX - this._offsetX) + 'px';
      this._ghost.style.top  = (e.clientY - this._offsetY) + 'px';

      // Highlight drop zones
      this._dropZones.forEach(({ el, onDrop }) => {
        const rect = el.getBoundingClientRect();
        const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top  && e.clientY <= rect.bottom;
        el.classList.toggle('drag-over', over);
      });
    }

    _onPointerUp(e) {
      document.removeEventListener('pointermove', this._onPointerMove);
      document.removeEventListener('pointerup',   this._onPointerUp);

      if (this._ghost) {
        this._ghost.remove();
        this._ghost = null;
      }

      if (this._dragging) {
        this._dragging.classList.remove('dragging');

        // Find the drop zone under the pointer
        const target = document.elementFromPoint(e.clientX, e.clientY);
        for (const { el, onDrop } of this._dropZones) {
          if (el === target || el.contains(target)) {
            onDrop(this._dragging, el);
            el.classList.remove('drag-over');
            break;
          }
          el.classList.remove('drag-over');
        }

        this._dragging = null;
        this._draggingData = null;
      }
    }

    /**
     * Define a drop zone.
     * @param {HTMLElement} el
     * @param {Function} onDrop — called with (draggedEl, zoneEl)
     */
    makeDropZone(el, onDrop) {
      el.classList.add('drop-zone');
      this._dropZones.push({ el, onDrop });
    }

    /**
     * Make children of containerEl sortable by dragging.
     * @param {HTMLElement} containerEl
     * @param {Function} onReorder — called with new order array of elements
     */
    makeSortable(containerEl, onReorder) {
      const dd = new DragDrop();
      let dragSrc = null;

      function refresh() {
        Array.from(containerEl.children).forEach(child => {
          child.classList.add('draggable');
          child.setAttribute('draggable', 'false');

          child.addEventListener('pointerdown', startDrag);
        });
      }

      function startDrag(e) {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        dragSrc = this;
        dragSrc.classList.add('dragging');
        dragSrc.setPointerCapture(e.pointerId);

        const rect = dragSrc.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const ghost = dragSrc.cloneNode(true);
        ghost.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;
          width:${rect.width}px;height:${rect.height}px;
          opacity:0.85;pointer-events:none;z-index:9999;
          box-shadow:0 8px 24px rgba(0,0,0,0.18);transform:rotate(1.5deg) scale(1.03);`;
        document.body.appendChild(ghost);

        function onMove(me) {
          ghost.style.left = (me.clientX - offsetX) + 'px';
          ghost.style.top  = (me.clientY - offsetY) + 'px';

          const elUnder = document.elementFromPoint(me.clientX, me.clientY);
          if (!elUnder) return;
          const sibling = elUnder.closest && elUnder.closest('[draggable="false"]');
          if (sibling && sibling !== dragSrc && containerEl.contains(sibling)) {
            const rect2 = sibling.getBoundingClientRect();
            const mid   = rect2.top + rect2.height / 2;
            if (me.clientY < mid) {
              containerEl.insertBefore(dragSrc, sibling);
            } else {
              containerEl.insertBefore(dragSrc, sibling.nextSibling);
            }
          }
        }

        function onUp() {
          ghost.remove();
          dragSrc && dragSrc.classList.remove('dragging');
          dragSrc = null;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          if (onReorder) onReorder(Array.from(containerEl.children));
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      }

      refresh();

      // Re-attach listeners if children change
      const obs = new MutationObserver(() => {
        Array.from(containerEl.children).forEach(child => {
          if (!child._sortableAttached) {
            child._sortableAttached = true;
            child.classList.add('draggable');
            child.setAttribute('draggable', 'false');
            child.addEventListener('pointerdown', startDrag);
          }
        });
      });
      obs.observe(containerEl, { childList: true });

      return { refresh };
    }
  }

  global.DragDrop = DragDrop;

})(window);
