import axios from "axios";
import * as Cheerio from "cheerio";

async function scrapeWebPage(url) {
  const { data } = await axios.get(url);
  const $ = Cheerio.load(data);

  const pageHead = $("head").html();
  const pageBody = $("body").html();

  const internalLinks = [];
  const externalLinks = [];

  $("a").each((_, el) => {
    const link = $(el).attr("href");
    if (link === "/") return;
    if (link.startsWith("http") || link.startsWith("https")) {
      externalLinks.push(link);
    } else {
      internalLinks.push(link);
    }
  });

  return { head: pageHead, body: pageBody, internalLinks: internalLinks, externalLinks: externalLinks}
}

scrapeWebPage("https://mahendrakumawat.xyz").then(console.log);
