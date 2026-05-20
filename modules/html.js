const HTML_RAW = Symbol("htmlRaw");
const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function rawHtml(value) {
  return { [HTML_RAW]: true, value: String(value ?? "") };
}

export function classNames(...values) {
  return values.flat(Infinity)
    .flatMap((value) => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return classNames(...value).split(" ").filter(Boolean);
      if (typeof value === "object") return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);
      return [String(value)];
    })
    .filter(Boolean)
    .join(" ");
}

function kebabCase(value) {
  return String(value).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function styleMap(styles = {}) {
  if (typeof styles === "string") return styles;
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== "")
    .map(([name, value]) => `${kebabCase(name)}:${value}`)
    .join(";");
}

export function htmlAttributes(attrs = {}) {
  return Object.entries(attrs)
    .flatMap(([name, value]) => {
      if (value === undefined || value === null || value === false) return [];
      if (value === true) return [escapeHtml(name)];
      const attrValue = name === "class"
        ? classNames(value)
        : name === "style" && typeof value === "object"
          ? styleMap(value)
          : value;
      if (attrValue === "") return [];
      return [`${escapeHtml(name)}="${escapeHtml(attrValue)}"`];
    })
    .join(" ");
}

function childToHtml(child) {
  if (child === undefined || child === null || child === false) return "";
  if (Array.isArray(child)) return child.map(childToHtml).join("");
  if (child && typeof child === "object" && child[HTML_RAW]) return child.value;
  return escapeHtml(child);
}

export function htmlTag(name, attrs = {}, children = []) {
  const attrText = htmlAttributes(attrs);
  const tagName = String(name).toLowerCase();
  const openTag = attrText ? `<${tagName} ${attrText}>` : `<${tagName}>`;
  if (VOID_ELEMENTS.has(tagName)) return openTag;
  return `${openTag}${childToHtml(children)}</${tagName}>`;
}
