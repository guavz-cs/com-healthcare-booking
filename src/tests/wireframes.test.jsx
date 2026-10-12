import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { axe } from 'jest-axe';

// Runs axe-core against the three STATIC wireframe pages (Part A).
// Note: jsdom cannot compute colours, so contrast is verified by the ratios in main.css comments.
const FILES = ['index.html', 'services.html', 'book.html'];

function load(file) {
  const html = readFileSync(resolve(__dirname, '../../wireframes', file), 'utf8');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc;
}

describe.each(FILES)('wireframe %s', (file) => {
  it('contains the required landmarks and no JavaScript', () => {
    const doc = load(file);
    for (const tag of ['header', 'nav', 'main', 'section', 'aside', 'footer']) {
      expect(doc.querySelector(tag), `<${tag}> missing`).not.toBeNull();
    }
    expect(doc.querySelectorAll('script').length).toBe(0);
    expect(doc.querySelectorAll('[onclick],[onchange],[onload]').length).toBe(0);
    expect(doc.documentElement.getAttribute('lang')).toBe('en-ZA');
    expect(doc.querySelectorAll('h1').length).toBe(1);
  });

  it('has no axe violations', async () => {
    const doc = load(file);
    document.documentElement.setAttribute('lang', 'en');
    document.title = doc.title;
    document.body.innerHTML = doc.body.innerHTML;
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('wireframe CSS', () => {
  const css = readFileSync(resolve(__dirname, '../../wireframes/main.css'), 'utf8');

  it('defines a :focus-visible ring and never removes outlines without a replacement', () => {
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline:\s*3px solid var\(--focus\)/);
    expect(css).not.toMatch(/outline:\s*(none|0)\s*;(?![^}]*focus-visible)/);
  });

  // Recompute every ratio written in the CSS audit comment, so the documented numbers cannot be wrong.
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const pairs = [...css.matchAll(/(#[0-9A-Fa-f]{6}) on --[\w-]+ (#[0-9A-Fa-f]{6})\s+([\d.]+):1/g)];

  it('documents its contrast ratios and every documented ratio is correct', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(10);
    for (const [, fg, bg, documented] of pairs) {
      expect(ratio(fg, bg), `${fg} on ${bg}`).toBeCloseTo(parseFloat(documented), 1);
    }
  });

  it('meets 4.5:1 for every documented text pair and 3:1 for non-text pairs', () => {
    const min = Math.min(...pairs.map(([, fg, bg]) => ratio(fg, bg)));
    expect(min).toBeGreaterThanOrEqual(4.5);
  });
});
