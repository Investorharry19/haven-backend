import { Router } from "express";
import HavenLease from "../schema/lease.js";
import HavenProperties from "../schema/property.js";
import HavenMaintenance from "../schema/maintenance.js";
import UserSchema from "../schema/user.js";
import jwt from "jsonwebtoken";

const PerformanceRouter = Router();

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
    }
  );

  return model.aggregate(pipeline);
}

PerformanceRouter.get("/performance/dashboard-data", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const token = authorization.split("Bearer ")[1];
    const userId = jwt.verify(token, process.env.JWTSECRET).Id;

    const user = await UserSchema.findById(userId);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // 👈 always Jan of this year

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

    // 👇 loop through ALL 12 months regardless of current date
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

      // % change calculation helper
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

    res.json(months);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default PerformanceRouter;
