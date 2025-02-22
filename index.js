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


// Ingest function - It will take a url, and this function is responsible to scrape the website recursively, make embeddings and store in chroma DB

async function ingest(url = ''){
  const { head, body, internalLinks} = await scrapeWebPage(url);
  const headEmbedding = await generateVectorEmbeddings( {text: head });

  const bodyChunks = chunkText(body, 2000);
  for( const chunk of bodyChunks){
  const bodyEmbedding = await generateVectorEmbeddings({ text: body });
  }
} 

// We cannot pass too log body text directly to create embeddings as there is a limit to pass the characters

// So we will write a function which will spit the text into the chunks as per the limit 

function chunkText(text, chunkSize){
  if(!text || chunkSize <= 0) return[];

  const words = text.split(/\s+/);
  const chunks = [];
  
  for(let i = 0; i < words.length; i += chunkSize){
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  return chunks[]
}


scrapeWebPage("https://mahendrakumawat.xyz").then(console.log);
