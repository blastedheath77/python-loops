/**
 * syntax-highlight.js
 * Tokenises Python source into HTML with <span class="..."> tags.
 */

(function(global) {
  'use strict';

  const KEYWORDS  = /\b(for|while|in|if|else|elif|break|continue|return|def|True|False|None|not|and|or)\b/g;
  const BUILTINS  = /\b(print|range|input|len)\b/g;
  const STRINGS   = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const NUMBERS   = /\b(\d+\.?\d*)\b/g;
  const COMMENTS  = /(#[^\n]*)/g;

  /**
   * Escape HTML special chars.
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Token-based highlighter.
   * Works by scanning left-to-right and picking the earliest match
   * among comments, strings, numbers, keywords, and builtins.
   */
  function highlightPython(code) {
    if (!code) return '';

    // We'll process token by token via a combined regex
    const combined = /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(for|while|in|if|else|elif|break|continue|return|def|True|False|None|not|and|or)\b|\b(print|range|input|len)\b|\b(\d+\.?\d*)\b/g;

    let result = '';
    let lastIndex = 0;

    let match;
    combined.lastIndex = 0;
    while ((match = combined.exec(code)) !== null) {
      // Append any literal text before this match
      if (match.index > lastIndex) {
        result += escapeHtml(code.slice(lastIndex, match.index));
      }

      const [full, comment, str, kw, builtin, num] = match;

      if (comment !== undefined) {
        result += `<span class="comment">${escapeHtml(full)}</span>`;
      } else if (str !== undefined) {
        result += `<span class="str">${escapeHtml(full)}</span>`;
      } else if (kw !== undefined) {
        result += `<span class="kw">${escapeHtml(full)}</span>`;
      } else if (builtin !== undefined) {
        result += `<span class="builtin">${escapeHtml(full)}</span>`;
      } else if (num !== undefined) {
        result += `<span class="num">${escapeHtml(full)}</span>`;
      } else {
        result += escapeHtml(full);
      }

      lastIndex = match.index + full.length;
    }

    // Append any remaining text
    if (lastIndex < code.length) {
      result += escapeHtml(code.slice(lastIndex));
    }

    return result;
  }

  /**
   * Apply syntax highlighting to all <code> elements that have
   * data-lang="python" (or are inside a <pre>) on the page.
   */
  function highlightAll() {
    document.querySelectorAll('pre code, code[data-lang="python"]').forEach(el => {
      el.innerHTML = highlightPython(el.textContent);
    });
  }

  global.highlightPython = highlightPython;
  global.highlightAll    = highlightAll;

  // Auto-run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightAll);
  } else {
    highlightAll();
  }

})(window);
