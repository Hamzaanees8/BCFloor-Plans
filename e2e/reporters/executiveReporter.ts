import fs from 'fs';
import path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

interface ExecutiveReporterOptions {
  outputFile?: string;
  title?: string;
  subtitle?: string;
}

interface CapturedScreenshot {
  name: string;
  dataUri: string;
}

interface CapturedCase {
  caseId: string;
  area: string;
  role: string;
  title: string;
  summary: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  durationMs: number;
  steps: Array<{ title: string; status: 'passed' | 'failed' }>;
  screenshots: CapturedScreenshot[];
  errorMessage?: string;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getAnnotation(test: TestCase, type: string, fallback = ''): string {
  const found = test.annotations.find((a) => a.type === type);
  return found?.description?.trim() || fallback;
}

export default class ExecutiveReporter implements Reporter {
  private options: Required<ExecutiveReporterOptions>;
  private cases: CapturedCase[] = [];
  private startTime = Date.now();
  private baseUrl = '';

  constructor(options: ExecutiveReporterOptions = {}) {
    this.options = {
      outputFile: options.outputFile || 'e2e-reports/client-summary.html',
      title: options.title || 'Booking & Scheduling — QA Verification Report',
      subtitle:
        options.subtitle ||
        'Automated end-to-end verification summary for business & client stakeholders',
    };
  }

  onBegin(config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    this.baseUrl =
      (config.projects[0]?.use?.baseURL as string) ||
      process.env.E2E_BASE_URL ||
      'http://localhost:3000';
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const parentGroup = test.parent?.title || 'General Verification';
    const caseId = getAnnotation(test, 'caseId', '');
    const area = getAnnotation(test, 'area', parentGroup);
    const role = getAnnotation(test, 'role', 'All Users');
    const summary = getAnnotation(test, 'summary', '');

    // Collect top-level test.step() entries (category === 'test.step')
    const steps: Array<{ title: string; status: 'passed' | 'failed' }> = [];
    for (const step of result.steps) {
      if (step.category === 'test.step') {
        steps.push({
          title: step.title,
          status: step.error ? 'failed' : 'passed',
        });
      }
    }

    // Collect image attachments (proof screenshots on pass + failure screenshots) as embedded base64
    const screenshots: CapturedScreenshot[] = [];
    for (const att of result.attachments) {
      if (!att.contentType?.startsWith('image/')) continue;
      try {
        let buf: Buffer | null = null;
        if (att.body) {
          buf = att.body;
        } else if (att.path && fs.existsSync(att.path)) {
          buf = fs.readFileSync(att.path);
        }
        if (buf) {
          screenshots.push({
            name: att.name || 'Verification Screenshot',
            dataUri: `data:${att.contentType};base64,${buf.toString('base64')}`,
          });
        }
      } catch {
        // Skip unreadable attachment without failing report generation
      }
    }

    const rawError = result.error?.message
      ? result.error.message.replace(/\u001b\[[0-9;]*m/g, '')
      : undefined;

    this.cases.push({
      caseId,
      area,
      role,
      title: test.title,
      summary,
      status: result.status,
      durationMs: result.duration,
      steps,
      screenshots,
      errorMessage: rawError,
    });
  }

  onEnd(_result: FullResult): void {
    const total = this.cases.length;
    const passed = this.cases.filter((c) => c.status === 'passed').length;
    const failed = this.cases.filter(
      (c) => c.status === 'failed' || c.status === 'timedOut' || c.status === 'interrupted'
    ).length;
    const skipped = this.cases.filter((c) => c.status === 'skipped').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const totalDuration = Date.now() - this.startTime;
    const generatedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Group cases by business area
    const grouped = new Map<string, CapturedCase[]>();
    for (const c of this.cases) {
      const list = grouped.get(c.area) || [];
      list.push(c);
      grouped.set(c.area, list);
    }

    const html = this.renderHtml({
      total,
      passed,
      failed,
      skipped,
      passRate,
      totalDuration,
      generatedAt,
      grouped,
    });

    const outPath = path.resolve(process.cwd(), this.options.outputFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf-8');

    console.log(`\n📊 Client & Executive QA Summary generated: ${outPath}`);
    console.log(`   Result: ${passed}/${total} passed (${passRate}%) — open in browser or Print → Save as PDF.\n`);
  }

  private renderHtml(data: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    totalDuration: number;
    generatedAt: string;
    grouped: Map<string, CapturedCase[]>;
  }): string {
    const { total, passed, failed, skipped, passRate, totalDuration, generatedAt, grouped } = data;
    const ringCircumference = 2 * Math.PI * 40;
    const ringOffset = ringCircumference * (1 - passRate / 100);
    const ringColor = failed === 0 ? '#16a34a' : passRate >= 75 ? '#d97706' : '#dc2626';

    const sectionsHtml = Array.from(grouped.entries())
      .map(([area, items]) => {
        const areaPassed = items.filter((i) => i.status === 'passed').length;
        const cardsHtml = items
          .map((item) => {
            const isPass = item.status === 'passed';
            const badgeClass = isPass ? 'badge-pass' : 'badge-fail';
            const badgeLabel = isPass ? 'Verified' : 'Needs Attention';

            const stepsHtml =
              item.steps.length > 0
                ? `<ul class="steps-list">${item.steps
                    .map(
                      (s) =>
                        `<li class="${s.status === 'passed' ? 'step-pass' : 'step-fail'}"><span class="step-icon">${
                          s.status === 'passed' ? '✓' : '✕'
                        }</span>${escapeHtml(s.title)}</li>`
                    )
                    .join('')}</ul>`
                : '';

            const shotsHtml =
              item.screenshots.length > 0
                ? `<div class="shots-grid">${item.screenshots
                    .map(
                      (shot) => `
                  <figure class="shot-card" onclick="openLightbox('${shot.dataUri}', '${escapeHtml(
                        shot.name
                      )}')">
                    <img src="${shot.dataUri}" alt="${escapeHtml(shot.name)}" loading="lazy" />
                    <figcaption>🔍 ${escapeHtml(shot.name)}</figcaption>
                  </figure>`
                    )
                    .join('')}</div>`
                : '';

            const errorHtml = item.errorMessage
              ? `<details class="tech-details">
                  <summary>Technical details (for Engineering)</summary>
                  <pre>${escapeHtml(item.errorMessage)}</pre>
                </details>`
              : '';

            return `
            <article class="case-card ${isPass ? 'is-pass' : 'is-fail'}" data-status="${
              isPass ? 'passed' : 'failed'
            }">
              <div class="case-header">
                <div class="case-meta">
                  ${item.caseId ? `<span class="pill pill-id">${escapeHtml(item.caseId)}</span>` : ''}
                  <span class="pill pill-role">${escapeHtml(item.role)}</span>
                  <span class="duration">${formatDuration(item.durationMs)}</span>
                </div>
                <span class="status-badge ${badgeClass}">${badgeLabel}</span>
              </div>
              <h3 class="case-title">${escapeHtml(item.title)}</h3>
              ${item.summary ? `<p class="case-summary">${escapeHtml(item.summary)}</p>` : ''}
              ${stepsHtml}
              ${shotsHtml}
              ${errorHtml}
            </article>`;
          })
          .join('\n');

        return `
        <section class="area-section">
          <div class="area-header">
            <h2>${escapeHtml(area)}</h2>
            <span class="area-count">${areaPassed} / ${items.length} Verified</span>
          </div>
          <div class="cards-stack">${cardsHtml}</div>
        </section>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(this.options.title)}</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #475569;
      --border: #e2e8f0;
      --pass: #16a34a;
      --pass-bg: #dcfce7;
      --fail: #dc2626;
      --fail-bg: #fee2e2;
      --accent: #2563eb;
      --accent-bg: #eff6ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .container { max-width: 1080px; margin: 0 auto; padding: 32px 24px 64px; }
    .hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    }
    .hero h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: -0.02em; }
    .hero p { margin: 0; color: var(--muted); font-size: 14px; }
    .hero-meta { margin-top: 12px; display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--muted); }
    .hero-actions { display: flex; gap: 10px; align-items: center; }
    .btn {
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn:hover { opacity: 0.92; }

    .kpi-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 220px repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 820px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .kpi-ring {
      flex-direction: row;
      align-items: center;
      gap: 16px;
    }
    .kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
    .kpi-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .kpi-value.pass { color: var(--pass); }
    .kpi-value.fail { color: var(--fail); }

    .filters {
      margin: 24px 0 8px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-btn {
      border: 1px solid var(--border);
      background: var(--card);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--muted);
    }
    .filter-btn.active { background: var(--text); color: #fff; border-color: var(--text); }

    .area-section { margin-top: 28px; }
    .area-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
    }
    .area-header h2 { margin: 0; font-size: 18px; }
    .area-count { font-size: 13px; font-weight: 600; color: var(--muted); }

    .cards-stack { display: flex; flex-direction: column; gap: 14px; }
    .case-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--pass);
      border-radius: 12px;
      padding: 18px 22px;
      page-break-inside: avoid;
    }
    .case-card.is-fail { border-left-color: var(--fail); }
    .case-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .case-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .pill {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .pill-id { background: #f1f5f9; color: #334155; }
    .pill-role { background: var(--accent-bg); color: var(--accent); }
    .duration { font-size: 12px; color: var(--muted); }
    .status-badge { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
    .badge-pass { background: var(--pass-bg); color: var(--pass); }
    .badge-fail { background: var(--fail-bg); color: var(--fail); }

    .case-title { margin: 10px 0 4px; font-size: 16px; }
    .case-summary { margin: 0 0 12px; font-size: 14px; color: var(--muted); }

    .steps-list { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 6px; }
    .steps-list li {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 8px;
    }
    .step-icon { font-weight: 700; width: 18px; text-align: center; }
    .step-pass .step-icon { color: var(--pass); }
    .step-fail .step-icon { color: var(--fail); }

    .shots-grid {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .shot-card {
      margin: 0;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      cursor: zoom-in;
      background: #fff;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .shot-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08); }
    .shot-card img { width: 100%; height: 160px; object-fit: cover; object-position: top; display: block; }
    .shot-card figcaption { padding: 8px 10px; font-size: 12px; color: var(--muted); border-top: 1px solid var(--border); }

    .tech-details { margin-top: 12px; font-size: 12px; }
    .tech-details summary { cursor: pointer; color: var(--fail); font-weight: 600; }
    .tech-details pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    /* Lightbox modal */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.85);
      z-index: 9999;
      padding: 24px;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
    }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 92vw; max-height: 82vh; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .lightbox-caption { color: #fff; font-size: 14px; font-weight: 500; }

    @media print {
      body { background: #fff; }
      .hero-actions, .filters, .lightbox { display: none !important; }
      .container { padding: 0; max-width: 100%; }
      .shot-card img { height: 220px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="hero">
      <div>
        <h1>${escapeHtml(this.options.title)}</h1>
        <p>${escapeHtml(this.options.subtitle)}</p>
        <div class="hero-meta">
          <span><strong>Date:</strong> ${escapeHtml(generatedAt)}</span>
          <span><strong>Environment:</strong> ${escapeHtml(this.baseUrl)}</span>
          <span><strong>Total Run Time:</strong> ${formatDuration(totalDuration)}</span>
        </div>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>
    </header>

    <section class="kpi-grid">
      <div class="kpi-card kpi-ring">
        <svg width="92" height="92" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" stroke-width="9" />
          <circle cx="48" cy="48" r="40" fill="none" stroke="${ringColor}" stroke-width="9"
            stroke-linecap="round"
            stroke-dasharray="${ringCircumference.toFixed(1)}"
            stroke-dashoffset="${ringOffset.toFixed(1)}"
            transform="rotate(-90 48 48)" />
          <text x="48" y="53" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">${passRate}%</text>
        </svg>
        <div>
          <div class="kpi-label">Pass Rate</div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px;">${
            failed === 0 ? 'All scenarios verified' : `${failed} item(s) need attention`
          }</div>
        </div>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Scenarios Tested</span>
        <span class="kpi-value">${total}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Verified (Pass)</span>
        <span class="kpi-value pass">${passed}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Needs Attention</span>
        <span class="kpi-value ${failed > 0 ? 'fail' : ''}">${failed}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Skipped</span>
        <span class="kpi-value">${skipped}</span>
      </div>
    </section>

    <div class="filters">
      <button class="filter-btn active" onclick="filterCases('all', this)">All (${total})</button>
      <button class="filter-btn" onclick="filterCases('passed', this)">Verified (${passed})</button>
      <button class="filter-btn" onclick="filterCases('failed', this)">Needs Attention (${failed})</button>
    </div>

    ${sectionsHtml}
  </div>

  <div id="lightbox" class="lightbox" onclick="closeLightbox()">
    <img id="lightbox-img" src="" alt="" />
    <div id="lightbox-caption" class="lightbox-caption"></div>
  </div>

  <script>
    function filterCases(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.case-card').forEach(card => {
        card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
      });
    }
    function openLightbox(src, caption) {
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox-caption').textContent = caption + ' (click anywhere to close)';
      document.getElementById('lightbox').classList.add('open');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('open');
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  </script>
</body>
</html>`;
  }
}
