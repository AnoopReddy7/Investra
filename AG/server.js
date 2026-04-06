import express from "express";
import cors from "cors";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Investra backend is running');
});

const normalizeSymbol = (symbol) => {
    if (!symbol) return symbol;
    const trimmed = symbol.toUpperCase().trim();
    if (/^[A-Z0-9]+$/.test(trimmed)) {
        return `${trimmed}.NS`;
    }
    return trimmed;
};

/* =========================
   SINGLE STOCK
========================= */

app.get("/api/quote/:symbol", async (req, res) => {

    try {

        const symbol = normalizeSymbol(req.params.symbol);

        const quote = await yahooFinance.quote(symbol);

        res.json({
            symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            percentChange: quote.regularMarketChangePercent
        });

    } catch (error) {

        console.error("Quote Error:", error);

        res.status(500).json({
            error: "Failed to fetch quote",
            details: error.message
        });

    }

});


/* =========================
   MULTIPLE STOCKS
========================= */

app.get("/api/stocks", async (req, res) => {

    try {

        const symbols = req.query.symbols;

        if (!symbols) {
            return res.status(400).json({ error: "Provide symbols" });
        }

        const list = symbols.split(",");

        const results = [];

        for (const rawSymbol of list) {
            const symbol = normalizeSymbol(rawSymbol);

            try {

                const quote = await yahooFinance.quote(symbol);

                results.push({
                    symbol,
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    percentChange: quote.regularMarketChangePercent
                });

            } catch (error) {

                console.log(`Failed: ${symbol}`, error.message);

            }

        }

        res.json(results);

    } catch (error) {

        console.error("Stock error:", error);

        res.status(500).json({
            error: "Failed to fetch stocks"
        });

    }

});


/* =========================
   MARKET INDICES
========================= */

app.get("/api/indices", async (req, res) => {

    try {

        const indices = {
            nifty50: "^NSEI",
            sensex: "^BSESN",
            niftyFinancial: "^CNXFIN",
            bankNifty: "^NSEBANK"
        };

        const results = {};

        for (const [name, symbol] of Object.entries(indices)) {

            try {

                const quote = await yahooFinance.quote(symbol);

                results[name] = {
                    value: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    percent: quote.regularMarketChangePercent
                };

            } catch {

                console.log(`Failed index: ${name}`);

            }

        }

        res.json(results);

    } catch (error) {

        console.error("Indices error:", error);

        res.status(500).json({
            error: "Failed to fetch indices"
        });

    }

});


import https from 'https';

const extractTag = (xml, tag) => {
    const startIdx = xml.indexOf("<" + tag);
    if (startIdx === -1) return "";
    const closeBracketIdx = xml.indexOf(">", startIdx);
    const endIdx = xml.indexOf("</" + tag + ">", closeBracketIdx);
    if (endIdx === -1) return "";
    let content = xml.substring(closeBracketIdx + 1, endIdx).trim();
    content = content.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
    content = content.replace(/<[^>]*>?/gm, '');
    return content;
};

const fetchRSS = (url, sourceName) => new Promise((resolve) => {
    https.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
             return fetchRSS(response.headers.location, sourceName).then(resolve);
        }
        let data = "";
        response.on("data", chunk => data += chunk);
        response.on("end", () => {
            const items = [];
            let currentIdx = 0;
            while ((currentIdx = data.indexOf("<item>", currentIdx)) !== -1) {
                const endItemIdx = data.indexOf("</item>", currentIdx);
                if (endItemIdx === -1) break;
                
                const itemXml = data.substring(currentIdx, endItemIdx);
                const title = extractTag(itemXml, "title");
                const link = extractTag(itemXml, "link");
                const description = extractTag(itemXml, "description");
                const pubDate = extractTag(itemXml, "pubDate");
                
                // Try to extract image URL from RSS image tags or media:content
                let imageUrl = extractTag(itemXml, "image");
                if (!imageUrl) imageUrl = extractTag(itemXml, "media:content");
                if (!imageUrl) imageUrl = extractTag(itemXml, "enclosure");
                if (!imageUrl) {
                    // Try to extract url attribute from media:content or enclosure
                    const mediaMatch = itemXml.match(/(?:media:content|enclosure)[^>]*url=["']([^"']+)["']/i);
                    if (mediaMatch) imageUrl = mediaMatch[1];
                }
                // Fallback to a generic financial news image
                if (!imageUrl) {
                    imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%231e293b'/%3E%3Crect width='400' height='200' fill='%230f172a' opacity='0.5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' fill='%2394a3b8' font-weight='bold'%3EFinancial News%3C/text%3E%3C/svg%3E";
                }

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        description: description || "",
                        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                        source: sourceName,
                        category: "Markets",
                        imageUrl: imageUrl
                    });
                }
                currentIdx = endItemIdx + 7;
            }
            resolve(items);
        });
    }).on("error", () => resolve([]));
});

/* =========================
   NEWS RSS PROXY
========================= */

app.get("/api/news/pulse", async (req, res) => {
    try {
        const feeds = [
            fetchRSS("https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms", "Economic Times"),
            fetchRSS("https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=12000000&id=10000664", "CNBC")
        ];
        
        const results = await Promise.all(feeds);
        const allNews = results.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        res.json(allNews.slice(0, 50));
    } catch (error) {
        console.error("RSS proxy error:", error);
        res.status(500).json({ error: "Failed" });
    }
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});