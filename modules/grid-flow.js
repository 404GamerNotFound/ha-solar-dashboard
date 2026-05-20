const GRID_IMPORT_ENTITY_KEYS = ["import_power", "grid_import_power", "import_export_import_power"];
const GRID_EXPORT_ENTITY_KEYS = ["export_power", "grid_export_power", "import_export_export_power"];

export function gridSignedEntityId(config = {}) {
  return config.entities?.import_export_power || "";
}

export function gridImportEntityId(config = {}) {
  return GRID_IMPORT_ENTITY_KEYS.map((key) => config.entities?.[key]).find(Boolean) || "";
}

export function gridExportEntityId(config = {}) {
  return GRID_EXPORT_ENTITY_KEYS.map((key) => config.entities?.[key]).find(Boolean) || "";
}

export function hasGridPowerSource(config = {}) {
  return Boolean(gridSignedEntityId(config) || gridImportEntityId(config) || gridExportEntityId(config));
}

export function gridPrimaryEntityId(config = {}) {
  return gridSignedEntityId(config) || gridImportEntityId(config) || gridExportEntityId(config);
}

function flowValueAsWatts(flowValue) {
  if (!flowValue) return 0;
  return Math.abs(flowValue.kind === "energy" ? flowValue.amount * 1000 : flowValue.amount || 0);
}

export function gridSignedFlowInfo({
  entityId = "",
  rawValue,
  entityUnit = "",
  unit = "auto",
  unavailableLabel = "Unavailable",
  formatValue,
  valueAsWatts,
  isEnergyUnit,
  formatEnergyValue,
  formatPowerValue,
} = {}) {
  if (!entityId) return undefined;
  const value = typeof formatValue === "function" ? formatValue(rawValue) : rawValue;
  if (value === "—") return { kind: "unavailable", label: unavailableLabel, value: "—" };

  const watts = typeof valueAsWatts === "function" ? valueAsWatts(rawValue, entityUnit) : undefined;
  if (!Number.isFinite(watts)) {
    const formattedValue = typeof isEnergyUnit === "function" && isEnergyUnit(entityUnit)
      ? formatEnergyValue(rawValue, entityUnit, unit === "auto" ? "kWh" : unit)
      : formatPowerValue(rawValue, unit, entityUnit);
    return { kind: "unknown", label: String(value), value: formattedValue };
  }
  return { kind: "flow", watts, unit };
}

export function gridSplitFlowInfo({
  importEntityId = "",
  exportEntityId = "",
  importValue,
  exportValue,
  unit = "auto",
  unavailableLabel = "Unavailable",
} = {}) {
  if (!importEntityId && !exportEntityId) return undefined;
  if (!importValue && !exportValue) return { kind: "unavailable", label: unavailableLabel, value: "—" };

  const importWatts = flowValueAsWatts(importValue);
  const exportWatts = flowValueAsWatts(exportValue);
  return {
    kind: "flow",
    watts: importWatts - exportWatts,
    unit,
  };
}

export function gridSplitPowerDetails({
  importEntityId = "",
  exportEntityId = "",
  importValue,
  exportValue,
} = {}) {
  if (!importEntityId || !exportEntityId) return undefined;
  return {
    importEntityId,
    exportEntityId,
    importWatts: flowValueAsWatts(importValue),
    exportWatts: flowValueAsWatts(exportValue),
  };
}

export function gridStatusFromFlowInfo(info, {
  neutralThreshold = 25,
  labelForKind,
  formatPowerValue,
} = {}) {
  if (!info) return { kind: "none", label: "", value: "" };
  if (info.kind !== "flow") return info;
  const watts = info.watts;
  const unit = info.unit || "auto";
  const magnitude = Math.abs(watts);
  if (magnitude <= neutralThreshold) {
    return {
      kind: "neutral",
      label: labelForKind?.("neutral") || "",
      value: formatPowerValue?.(0, unit, "W") || "0 W",
    };
  }

  const directionKind = watts < 0 ? "export" : "import";
  return {
    kind: directionKind,
    label: labelForKind?.(directionKind) || "",
    value: formatPowerValue?.(magnitude, unit, "W") || `${magnitude.toFixed(0)} W`,
  };
}

export function formatGridStatusReading(status = {}, unavailable = "—") {
  if (!status.label) return unavailable;
  if (status.kind === "neutral") return status.label;
  if (status.value && status.value !== unavailable) return `${status.label} ${status.value}`;
  return status.label;
}

export function formatGridValueReading(status = {}, unavailable = "—") {
  if (!status.label) return unavailable;
  return status.value || unavailable;
}

export function formatImportExportStatus(status = {}) {
  if (!status.label || status.kind === "unavailable") return "";
  if (status.kind === "neutral") return status.label;
  return `${status.label}: ${status.value}`;
}
