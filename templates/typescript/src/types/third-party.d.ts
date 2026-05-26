declare module "sanitize-html" {
  type SanitizeOptions = {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  };

  function sanitizeHtml(_value: string, _options?: SanitizeOptions): string;

  export default sanitizeHtml;
}
