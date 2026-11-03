import type { Request, Response } from "express";
import type { Model, PipelineStage } from "mongoose";
import HavenLease from "../schema/lease.ts";
import HavenProperties from "../schema/property.ts";
import HavenMaintenance from "../schema/maintenance.ts";
import { SendResponse } from "../utils/sendResponse.ts";

interface MonthlyCount {
  year: number;
  month: number;
  total: number;
}

interface MonthStats {
  year: number;
  month: string;
  properties: number;
  leases: number;
  maintenance: number;
  propertyChange: number;
  leaseChange: number;
  maintenanceChange: number;
}

type CountKey = "isUserId" | "notUserId";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// helper: get monthly counts for a model
function getMonthlyCounts(
  key: CountKey,
  // aggregate() doesn't depend on the document shape, so `any` is fine here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  userId: string,
  startDate: Date,
): Promise<MonthlyCount[]> {
  const ownerField = key === "isUserId" ? "userId" : "landlordId";

  const pipeline: PipelineStage[] = [
    { $match: { [ownerField]: userId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        year: "$_id.year",
        month: "$_id.month",
        total: 1,
        _id: 0,
      },
    },
  ];

  return model.aggregate<MonthlyCount>(pipeline);
}

// % change between two values
function calcChange(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function totalFor(counts: MonthlyCount[], year: number, month: number): number {
  return counts.find((c) => c.year === year && c.month === month)?.total ?? 0;
}

export async function PerformanceDashboardData(req: Request, res: Response) {
  try {
    const userId = req.authBearerId;
    if (!userId) {
      return SendResponse(res, {
        success: false,
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);

    const [leases, maintenance, properties] = await Promise.all([
      getMonthlyCounts("notUserId", HavenLease, userId, startDate),
      getMonthlyCounts("notUserId", HavenMaintenance, userId, startDate),
      getMonthlyCounts("isUserId", HavenProperties, userId, startDate),
    ]);

    const months: MonthStats[] = [];

    for (let month = 1; month <= 12; month++) {
      const propertyTotal = totalFor(properties, currentYear, month);
      const leaseTotal = totalFor(leases, currentYear, month);
      const maintenanceTotal = totalFor(maintenance, currentYear, month);

      const prev = months[months.length - 1];

      months.push({
        year: currentYear,
        month: MONTH_NAMES[month - 1],
        properties: propertyTotal,
        leases: leaseTotal,
        maintenance: maintenanceTotal,
        propertyChange: Number(
          calcChange(propertyTotal, prev?.properties ?? 0).toFixed(2),
        ),
        leaseChange: Number(
          calcChange(leaseTotal, prev?.leases ?? 0).toFixed(2),
        ),
        maintenanceChange: Number(
          calcChange(maintenanceTotal, prev?.maintenance ?? 0).toFixed(2),
        ),
      });
    }

    return SendResponse(res, { data: months });
  } catch (error) {
    console.error(error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Server error",
      data: error,
    });
  }
}
