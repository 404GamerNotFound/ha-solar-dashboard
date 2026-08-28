export function normalizeGridPrice(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const number = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, number) : "";
}

export function firstConfiguredPrice(values = []) {
  return values.map((value) => normalizeGridPrice(value)).find((value) => value !== "") ?? "";
}

export function gridImportPrice(config = {}, currentPrice = "") {
  return firstConfiguredPrice([
    currentPrice,
    config.grid_import_price,
    config.import_price,
    config.electricity_import_price,
    config.grid_import_cost,
  ]);
}

export function gridExportPrice(config = {}) {
  return firstConfiguredPrice([
    config.grid_export_price,
    config.export_price,
    config.feed_in_tariff,
    config.einspeiseverguetung,
  ]);
}

export function gridCurrency(config = {}) {
  return String(config.currency || config.grid_currency || "€").trim() || "€";
}

export function normalizeCurrencyPosition(value) {
  const normalized = String(value || "auto").trim().toLowerCase();
  return ["auto", "prefix", "suffix"].includes(normalized) ? normalized : "auto";
}

export function gridCurrencyPosition(config = {}) {
  return normalizeCurrencyPosition(config.currency_position || config.grid_currency_position || "auto");
}

function autoCurrencyPosition(currency) {
  const compactPrefixSymbols = ["$", "us$", "ca$", "a$", "nz$", "£", "¥", "₹", "₩", "₱", "₪", "₫", "฿"];
  return compactPrefixSymbols.includes(String(currency || "").trim().toLowerCase()) ? "prefix" : "suffix";
}

function currencyPrefixSeparator(currency) {
  const compact = String(currency || "").trim();
  return compact.length <= 1 || /[$£¥₹₩₱₪₫฿]/.test(compact) ? "" : " ";
}

export function formatMoneyValue(value, {
  currency = "€",
  currencyPosition = "auto",
  language = "en",
} = {}) {
  if (!Number.isFinite(value)) return "—";
  const position = normalizeCurrencyPosition(currencyPosition);
  if (/^[A-Z]{3}$/.test(currency) && position === "auto") {
    try {
      return new Intl.NumberFormat(language, { style: "currency", currency }).format(value);
    } catch (_err) {
      // Fall back to symbol formatting below.
    }
  }
  const formatted = value.toLocaleString(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const resolvedPosition = position === "auto" ? autoCurrencyPosition(currency) : position;
  if (resolvedPosition === "prefix") return `${currency}${currencyPrefixSeparator(currency)}${formatted}`;
  return `${formatted} ${currency}`;
}

export function todayStartDate(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function gridFinanceItems({
  config = {},
  importPrice = gridImportPrice(config),
  importPriceIsDynamic = false,
  exportPrice = gridExportPrice(config),
  importInfo,
  exportInfo,
  translate = (_key, _replacements, fallback) => fallback,
} = {}) {
  if (config.show_grid_daily_finance === false) return [];
  return [
    {
      kind: "import",
      price: importPrice,
      info: importInfo,
      label: importPriceIsDynamic
        ? translate("gridFinance.importCostCurrentRate", {}, "Today cost at current rate")
        : translate("gridFinance.importCost", {}, "Today cost"),
    },
    {
      kind: "export",
      price: exportPrice,
      info: exportInfo,
      label: translate("gridFinance.exportRevenue", {}, "Today revenue"),
    },
  ].filter((item) => item.price !== "" && item.info);
}

export function gridFinanceLabel(item, { formatMoney = formatMoneyValue } = {}) {
  if (!item) return "";
  if (item.info?.loading) return `${item.label}: …`;
  if (item.info?.error || !Number.isFinite(item.info?.amount)) return `${item.label}: —`;
  return `${item.label}: ${formatMoney(item.info.amount * item.price)}`;
}
