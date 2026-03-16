/**
 * Mock Telemetry Generator
 *
 * Generates realistic, asset-type-aware simulated telemetry and health score
 * data when no live data is available in the database.
 *
 * Values are seeded deterministically from the asset-id hash so they remain
 * consistent across re-renders whilst still looking "live".
 */

import type { GetLatestTelemetryResponse, GetHealthScoreResponse, TelemetryStatus } from "@/types/apm";

// ─── simple deterministic hash (djb2) ───────────────────────────────────────
function hashId(id: string): number {
    let hash = 5381;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) + hash) ^ id.charCodeAt(i);
    }
    return Math.abs(hash);
}

/** Returns a deterministic float in [min, max] seeded by asset id + offset */
function seeded(id: string, offset: number, min: number, max: number): number {
    const h = hashId(id + offset);
    return +(min + (h % 10000) / 10000 * (max - min)).toFixed(2);
}

// ─── type definitions ────────────────────────────────────────────────────────
interface ParameterDef {
    name: string;
    unit: string;
    normalMin: number;
    normalMax: number;
    warningMin?: number;
    warningMax?: number;
    criticalMin?: number;
    criticalMax?: number;
}

// ─── parameter profiles per asset type ──────────────────────────────────────
const ASSET_PARAMS: Record<string, ParameterDef[]> = {
    // Power Transformer
    power_transformer: [
        { name: "Oil Temperature", unit: "°C", normalMin: 40, normalMax: 75, warningMax: 85, criticalMax: 95 },
        { name: "Winding Temperature", unit: "°C", normalMin: 50, normalMax: 85, warningMax: 95, criticalMax: 110 },
        { name: "Load Factor", unit: "%", normalMin: 40, normalMax: 80, warningMax: 90, criticalMax: 100 },
        { name: "Dissolved Gas (H₂)", unit: "ppm", normalMin: 0, normalMax: 80, warningMax: 150, criticalMax: 300 },
        { name: "Tap Position", unit: "steps", normalMin: 1, normalMax: 17 },
        { name: "Cooling Fan Current", unit: "A", normalMin: 0.5, normalMax: 3, warningMax: 4, criticalMax: 5 },
    ],
    // Circuit Breaker
    circuit_breaker: [
        { name: "SF6 Gas Pressure", unit: "bar", normalMin: 5.5, normalMax: 6.5, warningMin: 5.2, criticalMin: 4.8 },
        { name: "Contact Wear", unit: "%", normalMin: 0, normalMax: 50, warningMax: 70, criticalMax: 90 },
        { name: "Operating Time", unit: "ms", normalMin: 35, normalMax: 65, warningMax: 80, criticalMax: 100 },
        { name: "Coil Current", unit: "A", normalMin: 1.5, normalMax: 3.5, warningMax: 4.5, criticalMax: 6 },
        { name: "Operation Count", unit: "ops", normalMin: 100, normalMax: 5000, warningMax: 8000, criticalMax: 10000 },
    ],
    // Protection Relay
    protection_relay: [
        { name: "Input Voltage", unit: "V", normalMin: 100, normalMax: 125, warningMin: 90, warningMax: 135, criticalMin: 80, criticalMax: 150 },
        { name: "Pickup Current", unit: "A", normalMin: 0.5, normalMax: 5, warningMax: 8 },
        { name: "Trip Time", unit: "ms", normalMin: 20, normalMax: 80, warningMax: 100, criticalMax: 150 },
        { name: "Self-Test Status", unit: "%", normalMin: 95, normalMax: 100, warningMin: 85, criticalMin: 70 },
    ],
    // Transmission Line
    transmission_line: [
        { name: "Line Current", unit: "A", normalMin: 200, normalMax: 800, warningMax: 950, criticalMax: 1100 },
        { name: "Line Voltage", unit: "kV", normalMin: 128, normalMax: 132, warningMin: 124, warningMax: 136, criticalMin: 120, criticalMax: 140 },
        { name: "Power Factor", unit: "PF", normalMin: 0.85, normalMax: 0.99 },
        { name: "Sag", unit: "m", normalMin: 5, normalMax: 12, warningMax: 14, criticalMax: 16 },
        { name: "Temperature", unit: "°C", normalMin: 25, normalMax: 60, warningMax: 75, criticalMax: 90 },
    ],
    // Energy Meter
    meter: [
        { name: "Active Power", unit: "kW", normalMin: 50, normalMax: 500, warningMax: 550, criticalMax: 600 },
        { name: "Reactive Power", unit: "kVAR", normalMin: 10, normalMax: 150 },
        { name: "Voltage L1", unit: "V", normalMin: 218, normalMax: 242, warningMin: 210, warningMax: 250, criticalMin: 200, criticalMax: 260 },
        { name: "Voltage L2", unit: "V", normalMin: 218, normalMax: 242, warningMin: 210, warningMax: 250 },
        { name: "Voltage L3", unit: "V", normalMin: 218, normalMax: 242, warningMin: 210, warningMax: 250 },
        { name: "Current L1", unit: "A", normalMin: 20, normalMax: 200, warningMax: 220, criticalMax: 250 },
        { name: "Power Factor", unit: "PF", normalMin: 0.85, normalMax: 0.99, warningMin: 0.75 },
        { name: "Frequency", unit: "Hz", normalMin: 49.8, normalMax: 50.2, warningMin: 49.5, warningMax: 50.5 },
        { name: "THD Voltage", unit: "%", normalMin: 0.5, normalMax: 3, warningMax: 5, criticalMax: 8 },
    ],
    // Busbar
    busbar: [
        { name: "Bus Voltage", unit: "kV", normalMin: 128, normalMax: 132, warningMin: 125, warningMax: 135, criticalMin: 120, criticalMax: 140 },
        { name: "Bus Current", unit: "A", normalMin: 100, normalMax: 600, warningMax: 750, criticalMax: 900 },
        { name: "Temperature", unit: "°C", normalMin: 25, normalMax: 55, warningMax: 70, criticalMax: 85 },
    ],
    // Disconnect Switch
    disconnect_switch: [
        { name: "Contact Resistance", unit: "μΩ", normalMin: 10, normalMax: 50, warningMax: 100, criticalMax: 200 },
        { name: "Operating Mechanism Temperature", unit: "°C", normalMin: 20, normalMax: 45, warningMax: 60, criticalMax: 75 },
        { name: "Position Signal", unit: "bool", normalMin: 0, normalMax: 1 },
    ],
    // Station Battery
    station_battery: [
        { name: "Battery Voltage", unit: "V", normalMin: 24, normalMax: 27.5, warningMin: 22, warningMax: 29, criticalMin: 20, criticalMax: 31 },
        { name: "Charge Current", unit: "A", normalMin: 0, normalMax: 20, warningMax: 25 },
        { name: "State of Charge", unit: "%", normalMin: 70, normalMax: 100, warningMin: 50, criticalMin: 30 },
        { name: "Cell Temperature", unit: "°C", normalMin: 15, normalMax: 35, warningMax: 45, criticalMax: 55 },
        { name: "Internal Resistance", unit: "mΩ", normalMin: 1, normalMax: 5, warningMax: 8, criticalMax: 12 },
    ],
    // SCADA/RTU
    scada_rtu: [
        { name: "CPU Load", unit: "%", normalMin: 5, normalMax: 40, warningMax: 70, criticalMax: 90 },
        { name: "Memory Usage", unit: "%", normalMin: 20, normalMax: 60, warningMax: 80, criticalMax: 95 },
        { name: "Communication Latency", unit: "ms", normalMin: 5, normalMax: 50, warningMax: 100, criticalMax: 500 },
        { name: "Signal Quality", unit: "%", normalMin: 80, normalMax: 100, warningMin: 60, criticalMin: 40 },
    ],
};

// Fallback generic params for any unrecognised type
const GENERIC_PARAMS: ParameterDef[] = [
    { name: "Temperature", unit: "°C", normalMin: 20, normalMax: 60, warningMax: 75, criticalMax: 90 },
    { name: "Voltage", unit: "V", normalMin: 380, normalMax: 420, warningMin: 360, warningMax: 440, criticalMin: 340, criticalMax: 460 },
    { name: "Current", unit: "A", normalMin: 10, normalMax: 100, warningMax: 120, criticalMax: 150 },
    { name: "Power Factor", unit: "PF", normalMin: 0.85, normalMax: 0.99, warningMin: 0.75 },
];

// ─── map asset type strings to profile keys ──────────────────────────────────
function resolveProfileKey(assetType: string): string {
    const t = (assetType || "").toLowerCase().replace(/\s+/g, "_");
    if (t.includes("transformer")) return "power_transformer";
    if (t.includes("breaker")) return "circuit_breaker";
    if (t.includes("relay")) return "protection_relay";
    if (t.includes("line") || t.includes("feeder")) return "transmission_line";
    if (t.includes("meter") || t.includes("energy")) return "meter";
    if (t.includes("busbar") || t.includes("bus")) return "busbar";
    if (t.includes("disconnect") || t.includes("switch")) return "disconnect_switch";
    if (t.includes("battery")) return "station_battery";
    if (t.includes("scada") || t.includes("rtu") || t.includes("plc")) return "scada_rtu";
    return "";
}

// ─── compute telemetry status from thresholds ─────────────────────────────
function computeStatus(value: number, def: ParameterDef): TelemetryStatus {
    if (def.criticalMax !== undefined && value > def.criticalMax) return "Critical";
    if (def.criticalMin !== undefined && value < def.criticalMin) return "Critical";
    if (def.warningMax !== undefined && value > def.warningMax) return "Warning";
    if (def.warningMin !== undefined && value < def.warningMin) return "Warning";
    return "Normal";
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Generate a mock `GetLatestTelemetryResponse` for an asset.
 *
 * @param assetId   - Asset UUID (used for deterministic seeding)
 * @param assetType - Asset type string (e.g. "Energy Meter", "circuit_breaker")
 */
export function generateMockTelemetry(
    assetId: string,
    assetType: string
): GetLatestTelemetryResponse {
    const key = resolveProfileKey(assetType);
    const params = ASSET_PARAMS[key] ?? GENERIC_PARAMS;
    const now = new Date().toISOString();

    const readings = params.map((def, idx) => {
        const value = seeded(assetId, idx * 17, def.normalMin, def.normalMax);
        const status = computeStatus(value, def);
        return {
            parameter_id: `mock-param-${idx}`,
            parameter_name: def.name,
            value,
            unit: def.unit,
            status,
            timestamp: now,
        };
    });

    return { asset_id: assetId, readings };
}

/**
 * Generate a mock `GetHealthScoreResponse` for an asset.
 *
 * Score is deterministic (seeded) so it stays stable across re-renders,
 * but looks realistic: 65-98 range.
 */
export function generateMockHealthScore(
    assetId: string,
    assetType: string
): GetHealthScoreResponse {
    const score = seeded(assetId, 999, 65, 98);
    const key = resolveProfileKey(assetType);
    const params = ASSET_PARAMS[key] ?? GENERIC_PARAMS;
    const now = new Date().toISOString();

    const weight = 100 / params.length;
    const breakdown: GetHealthScoreResponse["breakdown"] = params.map((def, idx) => {
        const value = seeded(assetId, idx * 17, def.normalMin, def.normalMax);
        return {
            parameter_name: def.name,
            contribution: +weight.toFixed(1),
            current_value: value,
            status: computeStatus(value, def),
        };
    });

    return {
        asset_id: assetId,
        score: +score.toFixed(0),
        computed_at: now,
        model_version: "mock-v1",
        breakdown,
    };
}

/**
 * Generate mock time-series data for trend charts (last 24 hours, 1-hour intervals).
 *
 * Each data-point adds ±5% jitter on top of the base seeded value so charts
 * look alive rather than flat.
 */
export function generateMockTrendSeries(
    assetId: string,
    assetType: string,
    parameterName: string,
    hours = 24
): Array<{ timestamp: string; value: number; unit: string; status: TelemetryStatus }> {
    const key = resolveProfileKey(assetType);
    const params = ASSET_PARAMS[key] ?? GENERIC_PARAMS;
    const def = params.find(p => p.name === parameterName) ?? params[0];
    const base = seeded(assetId, 77, def.normalMin, def.normalMax);
    const range = def.normalMax - def.normalMin;

    const now = Date.now();
    return Array.from({ length: hours }, (_, i) => {
        const t = new Date(now - (hours - i) * 3_600_000).toISOString();
        const jitter = (Math.sin(i * 0.6 + hashId(assetId) % 10) * 0.08 + (Math.random() - 0.5) * 0.04) * range;
        const value = +Math.max(def.normalMin, Math.min(def.normalMax, base + jitter)).toFixed(2);
        return {
            timestamp: t,
            value,
            unit: def.unit,
            status: computeStatus(value, def),
        };
    });
}
