"use client";

import { useState, useEffect, useCallback } from "react";
import { VehicleData, TeslaVehicle } from "@/types/tesla";

interface TeslaDashboard {
  vehicle: TeslaVehicle;
  vehicleData: VehicleData;
}

interface VehicleDataResponse {
  data: VehicleData;
  cached?: boolean;
  vehicleAsleep?: boolean;
  cachedAt?: string;
}

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      data: TeslaDashboard;
      cached: boolean;
      vehicleAsleep: boolean;
      cachedAt: string | null;
    };

export function useTeslaData() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWaking, setIsWaking] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const vehiclesRes = await fetch("/api/tesla/vehicles");

      if (vehiclesRes.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!vehiclesRes.ok) {
        throw new Error("車両一覧の取得に失敗しました");
      }

      const { vehicles } = (await vehiclesRes.json()) as {
        vehicles: TeslaVehicle[];
      };

      if (!vehicles || vehicles.length === 0) {
        setState({
          status: "error",
          message: "Teslaアカウントに車両が登録されていません",
        });
        return;
      }

      const vehicle = vehicles[0];
      const dataRes = await fetch(`/api/tesla/vehicle-data?id=${vehicle.id}`);

      if (dataRes.status === 401) {
        window.location.href = "/";
        return;
      }

      const body = (await dataRes.json()) as VehicleDataResponse & {
        error?: string;
      };

      // 503 with vehicleAsleep and no data
      if (dataRes.status === 503 && body.vehicleAsleep) {
        setState({
          status: "error",
          message:
            "車両がスリープ中です。キャッシュデータがありません。車両を起動してください。",
        });
        return;
      }

      if (!dataRes.ok) {
        throw new Error("車両データの取得に失敗しました");
      }

      setState({
        status: "success",
        data: { vehicle, vehicleData: body.data },
        cached: body.cached ?? false,
        vehicleAsleep: body.vehicleAsleep ?? false,
        cachedAt: body.cachedAt ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "データ取得エラー";
      setState({ status: "error", message });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const wakeVehicle = useCallback(
    async (vehicleId: number) => {
      setIsWaking(true);
      try {
        const res = await fetch("/api/tesla/wake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicle_id: vehicleId }),
        });

        if (!res.ok) {
          throw new Error("車両の起動に失敗しました");
        }

        // Wait a moment then refresh data
        await new Promise((resolve) => setTimeout(resolve, 10000));
        await fetchData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "起動に失敗しました";
        setState({ status: "error", message });
      } finally {
        setIsWaking(false);
      }
    },
    [fetchData]
  );

  return { state, isRefreshing, isWaking, refresh, wakeVehicle };
}
