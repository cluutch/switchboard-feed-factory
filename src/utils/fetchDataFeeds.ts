import fs from "fs";
import chalk from "chalk";
import { selectSport, selectDates } from "./cli";
import prompts from "prompts";
import { fetchNbaFeeds } from "./nba/fetchNbaFeeds";
import { getNbaEventUrl } from "./nba/jobs/nba";
import { getEspnEventUrl } from "./nba/jobs/espn";
import { getYahooEventUrl } from "./nba/jobs/yahoo";
import { JsonInput } from "../types";
import { toDateString } from "./toDateString";

/**
 * Reads in program arguements and prompts, then returns the parsed JSON and DataFeedFactory
 *
 * @returns the configuration struct defining the cluster,
 * fulfillment manager, sport, and the parsed JSON file with the intended data feeds
 */
export async function fetchFeeds(): Promise<boolean> {
  const sport = await selectSport();
  if (sport.toLowerCase() === "epl") {
    console.error(chalk.red("EPL fetch not implemented yet"));
    return false;
  } else if (sport.toLowerCase() === "nba") {
    const success = await nba();
    return success;
  }
  return false;
}
export async function nba(): Promise<boolean> {
  const dates = await selectDates();
  console.log(dates);
  let allMatches: JsonInput[] = [];
  for await (const d of dates) {
    const matches: JsonInput[] = await fetchNbaFeeds(d);
    if (!matches) console.error(`failed to fetch feeds for ${d}`);
    allMatches = allMatches.concat(matches);
  }
  if (allMatches) {
    fs.writeFileSync(
      `./feeds/nba/JsonInput.json`,
      JSON.stringify(allMatches, null, 2)
    );
    const header =
      "Date,Name,NBA ID,ESPN ID,Yahoo ID,NBA Endpoint,SPN Endpoint,Yahoo Endpoint,";
    const csvLines: string[] = allMatches.map(
      (m) =>
        `"${toDateString(m.date)}","${m.name}","${m.nbaId}","${m.espnId}","${
          m.yahooId
        }","${getNbaEventUrl(m)}","${getEspnEventUrl(m)}","${getYahooEventUrl(
          m
        )}"`
    );
    csvLines.unshift(header);
    fs.writeFileSync(`./feeds/nba/AllFeeds.csv`, csvLines.join("\r\n"));
  }
  return true;
}

fetchFeeds().then(
  () => {
    console.log(chalk.green("Succesfully fetched Feeds"));
    process.exit();
  },
  (err) => {
    console.error(err);
  }
);
