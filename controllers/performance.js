import { Router } from "express";
import HavenLease from "../schema/lease.js";
import HavenProperties from "../schema/property.js";
import HavenMaintenance from "../schema/maintenance.js";
import UserSchema from "../schema/user.js";
import jwt from "jsonwebtoken";
import { SendResponse } from "../utils/sendResponse.js";

// helper: get monthly counts for a model
function getMonthlyCounts(key, model, userId, startDate) {
  const pipeline = [];

  if (key === "isUserId") {
    pipeline.push({
      $match: {
        userId: userId,
        createdAt: { $gte: startDate },
      },
    });
  } else if (key === "notUserId") {
    pipeline.push({
      $match: {
        landlordId: userId,
        createdAt: { $gte: startDate },
      },
    });
  }

  pipeline.push(
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
  );

  return model.aggregate(pipeline);
}

export async function PerformanceDashboardData(req, res) {
  try {
    const userId = req.authBearerId;

    const user = await UserSchema.findById(userId);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const startDate = new Date(currentYear, 0, 1);

    const [leases, maintenance, properties] = await Promise.all([
      getMonthlyCounts("notUserId", HavenLease, userId, startDate),
      getMonthlyCounts("notUserId", HavenMaintenance, userId, startDate),
      getMonthlyCounts("isUserId", HavenProperties, userId, startDate),
    ]);

    const monthNames = [
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
    ];

    const months = [];

    for (let month = 1; month <= 12; month++) {
      const propertyTotal =
        properties.find((p) => p.year === currentYear && p.month === month)
          ?.total || 0;

      const leaseTotal =
        leases.find((l) => l.year === currentYear && l.month === month)
          ?.total || 0;

      const maintenanceTotal =
        maintenance.find((m) => m.year === currentYear && m.month === month)
          ?.total || 0;

      const prev =
        months.length > 0
          ? months[months.length - 1]
          : { properties: 0, leases: 0, maintenance: 0 };

      function calcChange(current, previous) {
        if (previous === 0 && current === 0) return 0;
        if (previous === 0 && current > 0) return 100;
        return ((current - previous) / previous) * 100;
      }

      const propertyChange = calcChange(propertyTotal, prev.properties);
      const leaseChange = calcChange(leaseTotal, prev.leases);
      const maintenanceChange = calcChange(maintenanceTotal, prev.maintenance);

      months.push({
        year: currentYear,
        month: monthNames[month - 1],
        properties: propertyTotal,
        leases: leaseTotal,
        maintenance: maintenanceTotal,
        propertyChange: Number(propertyChange.toFixed(2)),
        leaseChange: Number(leaseChange.toFixed(2)),
        maintenanceChange: Number(maintenanceChange.toFixed(2)),
      });
    }

    return SendResponse(res, {
      data: months,
    });
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
