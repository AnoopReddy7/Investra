const FINNHUB_KEY = 'd6i6709r01ql9cif3e20d6i6709r01ql9cif3e2g';
const https = require('https');

const today = new Date().toISOString().split('T')[0];
const lastWeek = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];

https.get(`https://finnhub.io/api/v1/company-news?symbol=AAPL&from=${lastWeek}&to=${today}&token=${FINNHUB_KEY}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(`Original: ${json.length}`);
    if(json.length > 0)
       console.log(json[0].datetime, json[0].headline);
  });
});
