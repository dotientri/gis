import DOMPurify from 'dompurify';

function normalizeText(value = '') {
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function stripHtml(html = '') {
  const input = String(html || '');

  if (!input.trim()) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return normalizeText(
      input
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
    );
  }

  const document = new DOMParser().parseFromString(input, 'text/html');
  return normalizeText(document.body.textContent || '');
}

export function getRichTextLength(html = '') {
  return stripHtml(html).length;
}

export function isRichTextEmpty(html = '') {
  return getRichTextLength(html) === 0;
}

export function getExcerptFromHtml(html = '', maxLength = 180) {
  const text = stripHtml(html);

  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function sanitizeRichText(html = '') {
  if (isRichTextEmpty(html)) {
    return '';
  }

  return DOMPurify.sanitize(String(html), {
    USE_PROFILES: { html: true },
    ADD_DATA_URI_TAGS: ['img'],
  });
}
