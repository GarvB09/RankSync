const STRIP_HTML_RE = /<[^>]*>/g;
const DANGEROUS_URL_RE = /^(javascript|data|vbscript):/i;

exports.stripHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(STRIP_HTML_RE, '').trim();
};

exports.isAllowedUrl = (url) => {
  if (!url) return true;
  const trimmed = url.trim();
  if (DANGEROUS_URL_RE.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
