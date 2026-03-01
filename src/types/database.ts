export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      charging_sessions: {
        Row: {
          charge_rate_avg_kw: number | null
          charger_power_max_kw: number | null
          charging_type: string | null
          cost_estimate_jpy: number | null
          created_at: string | null
          end_battery_level: number | null
          ended_at: string | null
          energy_added_kwh: number | null
          id: string
          is_active: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          start_battery_level: number | null
          started_at: string
          vehicle_id: string
        }
        Insert: {
          charge_rate_avg_kw?: number | null
          charger_power_max_kw?: number | null
          charging_type?: string | null
          cost_estimate_jpy?: number | null
          created_at?: string | null
          end_battery_level?: number | null
          ended_at?: string | null
          energy_added_kwh?: number | null
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          start_battery_level?: number | null
          started_at: string
          vehicle_id: string
        }
        Update: {
          charge_rate_avg_kw?: number | null
          charger_power_max_kw?: number | null
          charging_type?: string | null
          cost_estimate_jpy?: number | null
          created_at?: string | null
          end_battery_level?: number | null
          ended_at?: string | null
          energy_added_kwh?: number | null
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          start_battery_level?: number | null
          started_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charging_sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_trips: {
        Row: {
          avg_speed_kmh: number | null
          created_at: string | null
          distance_km: number | null
          efficiency_wh_per_km: number | null
          end_battery_level: number | null
          end_lat: number | null
          end_lng: number | null
          end_odometer_km: number | null
          ended_at: string | null
          energy_used_kwh: number | null
          id: string
          is_active: boolean | null
          max_speed_kmh: number | null
          start_battery_level: number | null
          start_lat: number | null
          start_lng: number | null
          start_odometer_km: number | null
          started_at: string
          vehicle_id: string
        }
        Insert: {
          avg_speed_kmh?: number | null
          created_at?: string | null
          distance_km?: number | null
          efficiency_wh_per_km?: number | null
          end_battery_level?: number | null
          end_lat?: number | null
          end_lng?: number | null
          end_odometer_km?: number | null
          ended_at?: string | null
          energy_used_kwh?: number | null
          id?: string
          is_active?: boolean | null
          max_speed_kmh?: number | null
          start_battery_level?: number | null
          start_lat?: number | null
          start_lng?: number | null
          start_odometer_km?: number | null
          started_at: string
          vehicle_id: string
        }
        Update: {
          avg_speed_kmh?: number | null
          created_at?: string | null
          distance_km?: number | null
          efficiency_wh_per_km?: number | null
          end_battery_level?: number | null
          end_lat?: number | null
          end_lng?: number | null
          end_odometer_km?: number | null
          ended_at?: string | null
          energy_used_kwh?: number | null
          id?: string
          is_active?: boolean | null
          max_speed_kmh?: number | null
          start_battery_level?: number | null
          start_lat?: number | null
          start_lng?: number | null
          start_odometer_km?: number | null
          started_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string | null
          id: string
          refresh_token: string | null
          tesla_user_id: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          refresh_token?: string | null
          tesla_user_id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          refresh_token?: string | null
          tesla_user_id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_data_cache: {
        Row: {
          charge_state: Json | null
          climate_state: Json | null
          drive_state: Json | null
          fetched_at: string | null
          id: string
          vehicle_id: string
          vehicle_state: Json | null
          vehicle_status: string | null
        }
        Insert: {
          charge_state?: Json | null
          climate_state?: Json | null
          drive_state?: Json | null
          fetched_at?: string | null
          id?: string
          vehicle_id: string
          vehicle_state?: Json | null
          vehicle_status?: string | null
        }
        Update: {
          charge_state?: Json | null
          climate_state?: Json | null
          drive_state?: Json | null
          fetched_at?: string | null
          id?: string
          vehicle_id?: string
          vehicle_state?: Json | null
          vehicle_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_data_cache_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          display_name: string | null
          id: string
          tesla_vehicle_id: number
          user_id: string
          vehicle_id: number
          vin: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          tesla_vehicle_id: number
          user_id: string
          vehicle_id: number
          vin: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          tesla_vehicle_id?: number
          user_id?: string
          vehicle_id?: number
          vin?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] &
  DefaultSchema["Views"])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends {
  Update: infer U
}
  ? U
  : never
