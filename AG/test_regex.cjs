const FINNHUB_KEY = 'd6i6709r01ql9cif3e20d6i6709r01ql9cif3e2g';
const https = require('https');

https.get(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const marketKeywords = /\b(stock|market|shares|equity|index|indices|nifty|sensex|bse|nse|invest|trading|dividend|earnings|ipo|rupee|finance|bank|economy|bull|bear|inflation|rate|gdp|cpi|interest)\b/i;
    const filtered = json.filter(item => {
      const text = `${item.headline} ${item.summary}`.toLowerCase();
      return marketKeywords.test(text);
    });
    console.log(`Original: ${json.length}, Filtered: ${filtered.length}`);
    for(let i=0; i<3; i++) console.log(filtered[i].headline);
  });
});
