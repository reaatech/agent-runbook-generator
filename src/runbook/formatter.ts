/**
 * Formatter - Generates runbook in various formats (Markdown, HTML, PDF)
 */

import { type Runbook, type RunbookSection } from '../types/domain.js';

export type OutputFormat = 'markdown' | 'html' | 'pdf' | 'json';

/**
 * Format runbook to Markdown
 */
export function formatAsMarkdown(runbook: Runbook): string {
  let markdown = `# ${runbook.title}\n\n`;
  markdown += `**Generated:** ${runbook.generatedAt}\n`;
  markdown += `**Version:** ${runbook.version}\n`;
  markdown += `**Service:** ${runbook.serviceName}\n`;
  if (runbook.team) markdown += `**Team:** ${runbook.team}\n`;
  if (runbook.repository) markdown += `**Repository:** ${runbook.repository}\n`;
  markdown += '\n---\n\n';

  // Table of contents
  markdown += generateMarkdownTOC(runbook);
  markdown += '\n---\n\n';

  // Sections
  runbook.sections.forEach(section => {
    markdown += formatSectionAsMarkdown(section);
  });

  return markdown;
}

function generateMarkdownTOC(runbook: Runbook): string {
  let toc = '## Table of Contents\n\n';

  runbook.sections.forEach(section => {
    const anchor = section.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    toc += `${section.order}. [${section.title}](#${anchor})\n`;

    section.subsections.forEach((sub, idx) => {
      const subAnchor = sub.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      toc += `   ${idx + 1}. [${sub.title}](#${subAnchor})\n`;
    });
  });

  return toc;
}

function formatSectionAsMarkdown(section: RunbookSection): string {
  let content = `## ${section.title}\n\n`;
  content += normalizeEmbeddedHeadings(section.content, 2);
  content += '\n\n';

  section.subsections.forEach(sub => {
    content += `### ${sub.title}\n\n`;
    content += `${normalizeEmbeddedHeadings(sub.content, 3)}\n\n`;
  });

  return content;
}

function normalizeEmbeddedHeadings(content: string, minimumLevel: number): string {
  return content.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes: string, title: string) => {
    const adjustedLevel = Math.min(6, Math.max(minimumLevel + 1, hashes.length + 1));
    return `${'#'.repeat(adjustedLevel)} ${title}`;
  }).trim();
}

/**
 * Format runbook to HTML
 */
export function formatAsHTML(runbook: Runbook): string {
  const markdown = formatAsMarkdown(runbook);
  const html = markdownToHtml(markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${runbook.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 30px; }
    h3 { margin-top: 20px; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f4f4f4;
      font-weight: 600;
    }
    .meta {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .toc {
      background: #f9f9f9;
      padding: 15px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .toc ul {
      margin: 0;
      padding-left: 20px;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 30px 0;
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple Markdown to HTML converter
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Extract and protect code blocks first
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return placeholder;
  });

  // Extract and protect inline code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_match, code: string) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Headers (escape content)
  html = html.replace(/^### (.*$)/gm, (_match, content: string) => `<h3>${escapeHtml(content)}</h3>`);
  html = html.replace(/^## (.*$)/gm, (_match, content: string) => `<h2>${escapeHtml(content)}</h2>`);
  html = html.replace(/^# (.*$)/gm, (_match, content: string) => `<h1>${escapeHtml(content)}</h1>`);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Links (escape href to prevent javascript: URLs)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, href: string) => {
    const safeHref = href.startsWith('http') || href.startsWith('#') || href.startsWith('/')
      ? escapeHtml(href)
      : '#';
    return `<a href="${safeHref}">${escapeHtml(text)}</a>`;
  });

  // Lists
  html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Tables (simplified)
  html = html.replace(/^\|(.+)\|$/gm, (_match: string, content: string) => {
    const cells = content.split('|').map((c: string) => c.trim());
    const isHeader = cells[0]?.includes('---');
    if (isHeader) return '';
    const cellTag = cells[0]?.toLowerCase().includes('alert') || cells[0]?.toLowerCase().includes('panel') ? 'th' : 'td';
    return `<tr>${cells.map((c: string) => `<${cellTag}>${escapeHtml(c)}</${cellTag}>`).join('')}</tr>`;
  });

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Restore code blocks and inline code
  for (let i = 0; i < codeBlocks.length; i++) {
    html = html.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]!);
  }
  for (let i = 0; i < inlineCodes.length; i++) {
    html = html.replace(`__INLINE_CODE_${i}__`, inlineCodes[i]!);
  }

  // Clean up
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>(<table>)/g, '$1');
  html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)/g, '$1');
  html = html.replace(/(<\/hr>)\s*<\/p>/g, '$1');

  return html;
}

/**
 * Format runbook to PDF (generates HTML that can be printed to PDF)
 */
export function formatAsPDF(runbook: Runbook): string {
  // PDF format uses HTML with print-specific styles
  const html = formatAsHTML(runbook);

  // Add print-specific styles
  return html.replace(
    '</style>',
    `@media print {
      body { max-width: none; padding: 0; }
      a { text-decoration: none; color: inherit; }
      h1, h2 { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>`,
  );
}

/**
 * Export runbook in specified format
 */
export function exportRunbook(runbook: Runbook, format: OutputFormat = 'markdown'): string {
  switch (format) {
    case 'markdown':
      return formatAsMarkdown(runbook);
    case 'html':
      return formatAsHTML(runbook);
    case 'pdf':
      return formatAsPDF(runbook);
    case 'json':
      return JSON.stringify(runbook, null, 2);
    default:
      return formatAsMarkdown(runbook);
  }
}

export { exportRunbook as formatRunbook };
