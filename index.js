import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import * as Cheerio from "cheerio";
import OpenAI from "openai";
import { ChromaClient } from "chromadb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const chromaClient = new ChromaClient({ path: "http://localhost:8000" });
chromaClient.heartbeat();

const WEB_COLLECTION = `WEB_SCRAPED_DATA_COLLECTION-1`;

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

  return {
    head: pageHead,
    body: pageBody,
    internalLinks: internalLinks,
    externalLinks: externalLinks,
  };
}

// Function to generate vector embeddings

async function generateVectorEmbeddings({ text }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return embedding.data[0].embedding;
}

// Insert into Chroma DB Function

async function insertIntoDB({ embedding, url, body = "", head }) {
  const collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
  });
  collection.add({
    ids: [url],
    embeddings: [embedding],
    metadatas: [{ url, body, head }],
  });
}

// Ingest function - It will take a url, and this function is responsible to scrape the website recursively, make embeddings and store in chroma DB

async function ingest(url = "") {
  console.log("Ingesting: URL: ", url);
  const { head, body, internalLinks } = await scrapeWebPage(url);

  const bodyChunks = chunkText(body, 1000);
  for (const chunk of bodyChunks) {
    const bodyEmbedding = await generateVectorEmbeddings({ text: body });
    await insertIntoDB({ embedding: bodyEmbedding, url, head, body: chunk });

    // RECURSIVE CALL
    for (const link of internalLinks) {
      const _url = `${url}$link`;
      ingest(_url);
    }
  }
}

// We cannot pass too log body text directly to create embeddings as there is a limit to pass the characters

// So we will write a function which will spit the text into the chunks as per the limit

function chunkText(text, chunkSize) {
  if (!text || chunkSize <= 0) return [];

  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

ingest("https://mahendrakumawat.xyz");

// scrapeWebPage("https://mahendrakumawat.xyz").then(console.log);
