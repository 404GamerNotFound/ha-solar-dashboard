function clean(value) { return String(value || "").trim(); }

export function normalizeBatteries(batteries) {
  const source = Array.isArray(batteries) ? batteries : batteries && typeof batteries === "object"
    ? Object.entries(batteries).map(([id, value]) => value && typeof value === "object" ? { id, ...value } : { id, level_entity: value }) : [];
  return source.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw : { level_entity: raw };
    const number = index + 2;
    return {
      id: clean(item.id || item.key || item.name || item.label || `battery_${number}`).replace(/[^\w-]+/g, "_"),
      label: clean(item.label || item.name || `Battery ${number}`),
      level_entity: clean(item.level_entity || item.soc_entity || item.entity || item.entity_id),
      flow_power_entity: clean(item.flow_power_entity || item.battery_flow_power || item.power_entity),
      voltage_entity: clean(item.voltage_entity || item.battery_voltage),
      charge_power_entity: clean(item.charge_power_entity || item.battery_charge_power),
      discharge_power_entity: clean(item.discharge_power_entity || item.battery_discharge_power),
      min_soc_entity: clean(item.min_soc_entity || item.battery_min_soc),
      max_soc_entity: clean(item.max_soc_entity || item.battery_max_soc),
      temperature_entity: clean(item.temperature_entity || item.battery_temperature),
      cycles_today_entity: clean(item.cycles_today_entity || item.battery_cycles_today),
      visible: item.enabled === false ? false : item.visible !== false,
    };
  }).filter((item) => item.visible !== false || Object.entries(item).some(([key, value]) => key.endsWith("_entity") && value));
}
