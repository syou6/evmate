// Tesla OAuth tokens
export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Vehicle summary from Fleet API
export interface TeslaVehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: "online" | "asleep" | "offline";
  color: string | null;
}

// Charge state
export interface ChargeState {
  battery_level: number;
  battery_range: number;
  charge_energy_added: number;
  charge_limit_soc: number;
  charge_port_door_open: boolean;
  charge_rate: number;
  charger_power: number;
  charging_state: "Charging" | "Complete" | "Disconnected" | "Stopped";
  est_battery_range: number;
  ideal_battery_range: number;
  minutes_to_full_charge: number;
  time_to_full_charge: number;
  usable_battery_level: number;
}

// Drive state
export interface DriveState {
  gps_as_of: number;
  heading: number;
  latitude: number;
  longitude: number;
  power: number;
  speed: number | null;
  timestamp: number;
}

// Vehicle state
export interface VehicleState {
  car_version: string;
  locked: boolean;
  odometer: number;
  sentry_mode: boolean;
  tpms_pressure_fl: number;
  tpms_pressure_fr: number;
  tpms_pressure_rl: number;
  tpms_pressure_rr: number;
  vehicle_name: string;
}

// Climate state
export interface ClimateState {
  battery_heater: boolean;
  driver_temp_setting: number;
  inside_temp: number;
  is_climate_on: boolean;
  outside_temp: number;
  passenger_temp_setting: number;
}

// Full vehicle data response
export interface VehicleData {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
  charge_state: Partial<ChargeState> | null;
  drive_state: Partial<DriveState> | null;
  vehicle_state: Partial<VehicleState> | null;
  climate_state: Partial<ClimateState> | null;
}

// Dashboard display data
export interface DashboardData {
  vehicle: TeslaVehicle;
  batteryLevel: number;
  batteryRange: number;
  chargingState: string;
  isCharging: boolean;
  odometer: number;
  insideTemp: number;
  outsideTemp: number;
  isLocked: boolean;
  sentryMode: boolean;
  softwareVersion: string;
  lastUpdated: string;
}

// Charging session log
export interface ChargingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  energy_added: number; // kWh
  charge_rate_avg: number; // kW
  start_battery: number; // %
  end_battery: number; // %
  location_name: string | null;
  latitude: number;
  longitude: number;
  cost_estimate: number | null; // JPY
}

// Driving trip log
export interface DrivingTrip {
  id: string;
  started_at: string;
  ended_at: string;
  distance: number; // km
  energy_used: number; // kWh
  efficiency: number; // Wh/km
  start_battery: number;
  end_battery: number;
  avg_speed: number;
  max_speed: number;
}
