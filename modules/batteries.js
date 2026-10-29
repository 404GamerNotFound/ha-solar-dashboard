function clean(value) { return String(value || "").trim(); }

function batteryPosition(value) {
  if (value == null || String(value).trim() === "") return "";
  return Number.isFinite(Number(value)) ? Math.min(96, Math.max(4, Number(value))) : "";
}

export function normalizeBatteries(batteries) {
  const source = Array.isArray(batteries) ? batteries : batteries && typeof batteries === "object"
    ? Object.entries(batteries).map(([id, value]) => value && typeof value === "object" ? { id, ...value } : { id, level_entity: value }) : [];
  const usedIds = new Set();
  const baseIds = source.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw : {};
    return clean(item.id || item.key || item.name || item.label || `battery_${index + 2}`).replace(/[^\w-]+/g, "_") || `battery_${index + 2}`;
  });
  const reservedIds = new Set(baseIds);
  return source.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw : { level_entity: raw };
    const number = index + 2;
    const baseId = baseIds[index];
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      do { id = `${baseId}_${suffix++}`; } while (reservedIds.has(id));
    }
    usedIds.add(id);
    return {
      id,
      label: clean(item.label || item.name || `Battery ${number}`),
      level_entity: clean(item.level_entity || item.soc_entity || item.entity || item.entity_id),
      flow_power_entity: clean(item.flow_power_entity || item.battery_flow_power || item.power_entity),
      flow_inverted: item.flow_inverted === true || item.battery_flow_inverted === true || item.invert_flow === true,
      voltage_entity: clean(item.voltage_entity || item.battery_voltage),
      charge_power_entity: clean(item.charge_power_entity || item.battery_charge_power),
      discharge_power_entity: clean(item.discharge_power_entity || item.battery_discharge_power),
      min_soc_entity: clean(item.min_soc_entity || item.battery_min_soc),
      max_soc_entity: clean(item.max_soc_entity || item.battery_max_soc),
      temperature_entity: clean(item.temperature_entity || item.battery_temperature),
      cycles_today_entity: clean(item.cycles_today_entity || item.battery_cycles_today),
      left: batteryPosition(item.left ?? item.x),
      top: batteryPosition(item.top ?? item.y),
      show_image: item.show_image !== false && item.image !== false,
      show_footer: item.show_footer !== false && item.footer !== false && item.tile !== false,
      visible: item.enabled === false ? false : item.visible !== false,
    };
  }).filter((item) => item.visible !== false || Object.entries(item).some(([key, value]) => key.endsWith("_entity") && value));
}
