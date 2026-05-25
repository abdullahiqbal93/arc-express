import sanitizeHtml from "sanitize-html";

/**
 * Recursively strips all HTML / script tags from req.body string fields.
 * Prevents stored-XSS. Only applied on mutating methods with a JSON body.
 */
const SANITIZE_OPTS = { allowedTags: [], allowedAttributes: {} };

function deepSanitize(value) {
  if (typeof value === "string") {
    return sanitizeHtml(value, SANITIZE_OPTS).trim();
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepSanitize(v);
    }
    return out;
  }
  return value;
}

export const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  next();
};
