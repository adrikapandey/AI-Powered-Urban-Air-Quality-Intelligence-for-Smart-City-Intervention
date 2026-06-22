export interface StationTelemetry {
  aqi: number;
  pm25: number;
  pm10: number;
  traffic: number;
  industry: number;
  biomass: number;
  dust: number;
}

export interface WeatherInfo {
  wind_speed: number;
  wind_direction: number;
  mixing_height: number;
  active_fires: number;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zone: string;
  description: string;
  telemetry: StationTelemetry;
  weather: WeatherInfo;
}

export interface SourceBreakdown {
  [key: string]: number;
}

export interface Fingerprints {
  "PM2.5_PM10_Ratio": number;
  "SO2_NOx_Ratio": number;
  "CO_NO2_Ratio": number;
}

export interface AttributionData {
  station_id: string;
  station_name: string;
  confidence_score: number;
  source_breakdown: SourceBreakdown;
  fingerprints: Fingerprints;
  meteorology_applied: {
    wind_speed: number;
    wind_direction: number;
    mixing_height: number;
    active_fires: number;
  };
}

export interface ForecastItem {
  hour: number;
  aqi: number;
  pm25: number;
  pm10: number;
  wind_speed: number;
  wind_direction: number;
  mixing_height: number;
}

export interface ForecastData {
  station_id: string;
  station_name: string;
  baseline: ForecastItem[];
  mitigated: ForecastItem[];
}

export interface PolicyLevers {
  odd_even: boolean;
  stubble_ban: boolean;
  smog_cannons: boolean;
  factory_scaling: number;
  construction_ban: boolean;
}

export interface EnforcementTicket {
  id: string;
  station_id: string;
  zone: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  source_category: string;
  recommended_actions: string[];
  gps: {
    lat: number;
    lon: number;
  };
  status: "PENDING" | "ACTIVE" | "RESOLVED";
}
