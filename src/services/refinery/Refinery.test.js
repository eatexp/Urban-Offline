/**
 * Tests for The Refinery — HTML→Semantic Markdown distillation
 */
import { describe, it, expect } from 'vitest';
import {
    refine,
    compressWhitespace,
    truncateToTokenBudget
} from './Refinery';

// ── Helpers ──────────────────────────────────────────────────────────────────

const wrap = (body) => `<!DOCTYPE html><html><head><title>Test Article</title></head><body>${body}</body></html>`;

// ── refine() ─────────────────────────────────────────────────────────────────

describe('refine()', () => {
    it('converts basic HTML to Markdown', () => {
        const html = wrap('<h1>First Aid</h1><p>Apply <strong>pressure</strong> to the wound.</p>');
        const { markdown, meta } = refine(html);

        expect(markdown).toContain('# First Aid');
        expect(markdown).toContain('**pressure**');
        expect(markdown).toContain('to the wound');
        expect(meta.title).toBe('Test Article');
        expect(meta.charsBefore).toBeGreaterThan(0);
        expect(meta.charsAfter).toBeGreaterThan(0);
        expect(meta.compressionRatio).toBeGreaterThan(0);
        expect(meta.compressionRatio).toBeLessThan(1);
    });

    it('handles null/empty/undefined input gracefully', () => {
        expect(refine(null).markdown).toBe('');
        expect(refine('').markdown).toBe('');
        expect(refine(undefined).markdown).toBe('');
        expect(refine(null).meta.charsBefore).toBe(0);
    });

    it('strips boilerplate (scripts, styles, navboxes, galleries)', () => {
        const html = wrap(`
      <script>alert("xss")</script>
      <style>.foo { color: red }</style>
      <div class="navbox">Navigation junk</div>
      <div class="mw-editsection">[edit]</div>
      <div class="gallery">Image gallery</div>
      <div class="thumb">Thumbnail image</div>
      <p>Important content here.</p>
    `);
        const { markdown } = refine(html);

        expect(markdown).not.toContain('alert');
        expect(markdown).not.toContain('color: red');
        expect(markdown).not.toContain('Navigation junk');
        expect(markdown).not.toContain('[edit]');
        expect(markdown).not.toContain('Image gallery');
        expect(markdown).not.toContain('Thumbnail image');
        expect(markdown).toContain('Important content here');
    });

    it('converts lists correctly', () => {
        const html = wrap(`
      <ul>
        <li>Airway</li>
        <li>Breathing</li>
        <li>Circulation</li>
      </ul>
    `);
        const { markdown } = refine(html);

        expect(markdown).toContain('- Airway');
        expect(markdown).toContain('- Breathing');
        expect(markdown).toContain('- Circulation');
    });

    it('converts nested lists correctly', () => {
        const html = wrap(`
      <ul>
        <li>Level 1
          <ul>
             <li>Level 2</li>
          </ul>
        </li>
      </ul>
    `);
        const { markdown } = refine(html);
        // We aren't strictly enforcing indentation depth in the walker yet,
        // but let's ensure content appears
        expect(markdown).toContain('- Level 1');
        expect(markdown).toContain('- Level 2');
    });

    it('converts ordered lists with numbering', () => {
        const html = wrap(`
      <ol>
        <li>Check response</li>
        <li>Call for help</li>
        <li>Start CPR</li>
      </ol>
    `);
        const { markdown } = refine(html);

        expect(markdown).toContain('1. Check response');
        expect(markdown).toContain('2. Call for help');
        expect(markdown).toContain('3. Start CPR');
    });

    it('converts tables to pipe-delimited Markdown', () => {
        const html = wrap(`
      <table>
        <tr><th>Symptom</th><th>Action</th></tr>
        <tr><td>No breathing</td><td>Start CPR</td></tr>
        <tr><td>Bleeding</td><td>Apply pressure</td></tr>
      </table>
    `);
        const { markdown } = refine(html);

        expect(markdown).toContain('| Symptom | Action |');
        expect(markdown).toContain('| --- | --- |');
        expect(markdown).toContain('| No breathing | Start CPR |');
    });

    it('preserves emphasis and code inline', () => {
        const html = wrap('<p>Use <em>caution</em> with <code>tourniquets</code>.</p>');
        const { markdown } = refine(html);

        expect(markdown).toContain('*caution*');
        expect(markdown).toContain('`tourniquets`');
    });

    it('extracts sections in meta', () => {
        const html = wrap(`
      <h1>Emergency Guide</h1>
      <h2>Breathing</h2>
      <p>Check airways.</p>
      <h2>Circulation</h2>
      <p>Check pulse.</p>
    `);
        const { meta } = refine(html);

        expect(meta.sections).toContain('Emergency Guide');
        expect(meta.sections).toContain('Breathing');
        expect(meta.sections).toContain('Circulation');
    });

    it('falls back gracefully on malformed HTML', () => {
        const html = '<div><p>Unclosed tags <b>bold';
        const { markdown } = refine(html);

        // Should produce something, not crash
        expect(markdown).toBeTruthy();
        expect(markdown).toContain('bold');
    });
});

// ── truncateToTokenBudget() ──────────────────────────────────────────────────

describe('truncateToTokenBudget()', () => {
    it('returns full text when within budget', () => {
        const md = '# Title\n\nShort text.';
        const { text } = truncateToTokenBudget(md, 100);
        expect(text).toBe(md);
    });

    it('truncates at section boundary when over budget', () => {
        const md = '# Section 1\n\nContent for section one.\n\n# Section 2\n\nContent for section two with a lot more words to push us over the token budget.';
        // Budget of 10 tokens = ~40 chars — should include Section 1 only
        const { text, sections } = truncateToTokenBudget(md, 10);

        expect(text.length).toBeLessThan(md.length);
        expect(sections).toContain('Section 1');
    });
});

// ── compressWhitespace() ─────────────────────────────────────────────────────

describe('compressWhitespace()', () => {
    it('collapses excessive blank lines', () => {
        const input = 'Hello\n\n\n\n\n\nWorld';
        const output = compressWhitespace(input);
        expect(output).toBe('Hello\n\n\nWorld');
    });

    it('collapses horizontal whitespace', () => {
        const input = 'Hello     World';
        const output = compressWhitespace(input);
        expect(output).toBe('Hello World');
    });
});

// ── Performance ──────────────────────────────────────────────────────────────

describe('Performance', () => {
    it('refines a large HTML document in under 100ms', () => {
        // Generate ~50KB of realistic HTML
        const paragraphs = Array(200).fill(null).map((_, i) =>
            `<p>Paragraph ${i}: This is a test paragraph with <strong>bold</strong> and <em>italic</em> content about emergency preparedness procedures and survival techniques in urban environments.</p>`
        ).join('\n');

        const largeHTML = wrap(`
      <h1>Emergency Preparedness Guide</h1>
      <div class="navbox">Navigation junk to strip</div>
      <script>console.log('remove me')</script>
      ${paragraphs}
    `);

        expect(largeHTML.length).toBeGreaterThan(30000); // Confirm it's large enough

        const start = performance.now();
        const { markdown, meta } = refine(largeHTML);
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(100);
        expect(markdown).not.toContain('navbox');
        expect(markdown).not.toContain('console.log');
        expect(meta.compressionRatio).toBeLessThan(1);
    });
    it('visual verification: saves complex output to file', async () => {
        const fs = await import('fs/promises');
        const dirtyHTML = `
<!DOCTYPE html>
<html>
<head><title>Hypothermia - Wikipedia</title></head>
<body>
    <div class="mw-page-container">
        <a class="mw-jump-link" href="#content">Jump to content</a>
        <h1 id="firstHeading" class="firstHeading mw-first-heading">Hypothermia</h1>
        <div id="siteSub" class="noprint">From Wikipedia, the free encyclopedia</div>
        <div class="mw-parser-output">
            <div class="shortdescription nomobile noexcerpt noprint searchaux">Medical emergency where the body loses heat faster than it can produce it</div>
            <div class="infobox" style="width: 22em; float: right;">
                <table>
                    <tr><th colspan="2">Hypothermia</th></tr>
                    <tr><td colspan="2"><img src="hypothermia.jpg" alt="Person in snow"></td></tr>
                    <tr><th>Specialty</th><td>Emergency medicine</td></tr>
                </table>
            </div>
            <p><b>Hypothermia</b> is a <a href="/wiki/Medical_emergency">medical emergency</a> that occurs when your body loses heat faster than it can produce it, causing a dangerously low body temperature.</p>
            <div class="toc">
                <input type="checkbox" role="button" id="toctogglecheckbox" class="toctogglecheckbox" style="display:none">
                <div class="toctitle" lang="en" dir="ltr"><h2>Contents</h2><span class="toctogglespan"><label class="toctogglelabel" for="toctogglecheckbox"></label></span></div>
                <ul>
                    <li class="toclevel-1 tocsection-1"><a href="#Classification"><span class="tocnumber">1</span> <span class="toctext">Classification</span></a></li>
                    <li class="toclevel-1 tocsection-2"><a href="#Signs_and_symptoms"><span class="tocnumber">2</span> <span class="toctext">Signs and symptoms</span></a></li>
                </ul>
            </div>
            <h2><span class="mw-headline" id="Classification">Classification</span><span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="/w/index.php?title=Hypothermia&action=edit&section=1" title="Edit section: Classification">edit</a><span class="mw-editsection-bracket">]</span></span></h2>
            <p>Hypothermia is often defined as a body temperature below 35.0 °C (95.0 °F).</p>
            <h2><span class="mw-headline" id="Signs_and_symptoms">Signs and symptoms</span><span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="/w/index.php?title=Hypothermia&action=edit&section=2" title="Edit section: Signs and symptoms">edit</a><span class="mw-editsection-bracket">]</span></span></h2>
            <div class="thumb tright">
                <div class="thumbinner" style="width:220px;">
                    <a href="/wiki/File:Thermometer.jpg" class="image"><img alt="" src="//upload.wikimedia.org/etc.jpg" width="220" height="140" class="thumbimage"></a>
                    <div class="thumbcaption"><div class="magnify"><a href="/wiki/File:Thermometer.jpg" class="internal" title="Enlarge"></a></div>A thermometer showing low temp.</div>
                </div>
            </div>
            <p>Symptoms vary depending on the temperature.</p>
            <h3><span class="mw-headline" id="Mild">Mild</span></h3>
            <table>
                <caption>Symptoms of Mild Hypothermia</caption>
                <thead>
                    <tr><th>System</th><th>Symptoms</th></tr>
                </thead>
                <tbody>
                    <tr><td>Sympathetic nervous system</td><td>Shivering, high blood pressure, rapid heart rate</td></tr>
                    <tr><td>Central nervous system</td><td>Confusion, amnesia, difficulty speaking</td></tr>
                </tbody>
            </table>
            <div class="navbox" aria-labelledby="Trauma_and_injuries" style="padding:3px">
                <table class="nowraplinks hlist mw-collapsible autocollapse navbox-inner" style="border-spacing:0;background:transparent;color:inherit">
                    <tr><th scope="col" class="navbox-title" colspan="2">Trauma and injuries</th></tr>
                </table>
            </div>
            <div class="mw-authority-control" dir="ltr">Authority control content...</div>
        </div>
    </div>
</body>
</html>
        `;

        const { markdown, _meta } = refine(dirtyHTML, { tokenBudget: 600 });

        // Write to file for inspection
        await fs.writeFile('refined_visual.md', markdown, 'utf-8');

        expect(markdown).toContain('# Hypothermia');
        expect(markdown).not.toContain('Authority control');
        expect(markdown).not.toContain('Trauma and injuries'); // navbox
        expect(markdown).toContain('| Sympathetic nervous system | Shivering');
    });
});
