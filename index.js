import dotenv from 'dotenv';
dotenv.config()

import axios from "axios";
import * as Cheerio from "cheerio";
import OpenAI from "openai";

const openai = new OpenAI();

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


// Function to generate vector embeddings

async function generateVectorEmbeddings({ text }){
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data[0].embedding
}

scrapeWebPage("https://mahendrakumawat.xyz").then(console.log);
