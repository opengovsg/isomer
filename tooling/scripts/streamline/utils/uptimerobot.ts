import moment from "moment";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

// NOTE: This is a stub interface, as only the monitor ID is needed for now
interface GetUptimeRobotMonitorsResponse {
  data: {
    id: number;
    url: string;
  }[];
}

export const getUptimeRobotMonitors = async () => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.UPTIMEROBOT_API_KEY}`,
    },
  };

  const monitors = [];
  let cursor = 0;

  while (true) {
    const result = (await fetch(
      `https://api.uptimerobot.com/v3/monitors?cursor=${cursor}`,
      options
    ).then((response) => response.json())) as GetUptimeRobotMonitorsResponse;

    monitors.push(...result.data);

    if (result.data.length === 0) {
      break;
    }

    cursor = result.data.length + cursor;
  }

  return monitors;
};

export const createMaintenanceWindow = async (monitorIds: number[]) => {
  const launchDate = moment().add(7, "days").format("YYYY-MM-DD");
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.UPTIMEROBOT_API_KEY}`,
    },
    body: JSON.stringify({
      name: `Project Streamline - Site Launch ${launchDate}`,
      autoAddMonitors: false,
      interval: "once",
      date: launchDate,
      time: "14:00:00",
      duration: 120,
      monitorIds,
    }),
  };

  (await fetch(
    "https://api.uptimerobot.com/v3/maintenance-windows",
    options
  ).then((response) => response.json())) as unknown;
};
