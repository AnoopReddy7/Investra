import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const possibleSymbols = [
    '^MIDCPSELEC', 'NIFTY_MIDCAP_SELECT.NS', 'NIFTYMIDCAPSELECT.NS', // Nifty Midcap Select 
    '^NIFTYTOTAL', 'NIFTY_TOTAL_MARKET.NS', '^CNXTOTM', // Nifty Total Market
    '^CRSLMID', '^NIFTYMIDCAP100', '^CNXMDCP', 'NIFTY_MIDCAP_100.NS', // Nifty Midcap 100
    '^CNXSMCAP', '^NIFTYSMCAP100', 'NIFTY_SMLCAP_100.NS', 'NIFTY_SMALLCAP_100.NS',// Nifty Smallcap 100
    '^NIFTYSMCAP250', '^NIFTYSM250', 'NIFTY_SMALLCAP_250.NS', // NIFTY SMALLCAP 250
    '^NIFTYMIDCAP150', '^NIFTYMID150', 'NIFTY_MIDCAP_150.NS' // NIFTY MIDCAP 150
];

async function test() {
    for (const sym of possibleSymbols) {
        try {
            const quote = await yahooFinance.quote(sym);
            console.log(`✅ ${sym} : ${quote.shortName || quote.longName}`);
        } catch (e) {
            
        }
    }
}
test();
