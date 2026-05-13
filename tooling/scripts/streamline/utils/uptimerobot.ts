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
  nextLink: string | null | undefined;
}

export const getUptimeRobotMonitors = async () => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.UPTIMEROBOT_API_KEY}`,
    },
  };

  const monitors = [];
  let url = "https://api.uptimerobot.com/v3/monitors?limit=200";

  while (true) {
    const result = (await fetch(url, options).then((response) =>
      response.json(),
    )) as GetUptimeRobotMonitorsResponse;

    monitors.push(...result.data);

    if (!result.nextLink) {
      break;
    }

    url = result.nextLink.replace("http://", "https://");
  }

  return monitors;
};

export const createMaintenanceWindow = async (monitorIds: number[]) => {
  // Site launch is by default scheduled for 2 days later at 8pm SGT, and the
  // maintenance window is set to last for 4 hours
  const daysUntilLaunch = 2; // Change this if it is not 2 days from today
  const hourOfLaunch = "20:00:00"; // Change this if the launch time is not 8pm SGT

  const launchDate = moment().add(daysUntilLaunch, "days").format("YYYY-MM-DD");
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
      time: hourOfLaunch,
      duration: 4 * 60, // Duration in minutes (4 hours)
      monitorIds,
    }),
  };

  (await fetch(
    "https://api.uptimerobot.com/v3/maintenance-windows",
    options,
  ).then((response) => response.json())) as unknown;
};
