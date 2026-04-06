import yahooFinance from 'yahoo-finance2';

const possibleSymbols = [
    '^NSEI', // Nifty 50
    '^NSEBANK', // Bank Nifty
    'NIFTY_FIN_SERVICE.NS', '^CNXFIN', // Finnifty
    '^BSESN', // Sensex
    '^MIDCPSELEC', 'NIFTY_MIDCAP_SELECT.NS', // Nifty Midcap Select 
    'BSE-BANK.BO', '^BANKEX.BO', '^BANKEX', // Bankex
    '^INDIAVIX', // India Vix
    '^NIFTYTOTAL', 'NIFTY_TOTAL_MARKET.NS', '^CNXTOTM', // Nifty Total Market
    '^NN50', '^NSENEXT50', '^CNXNXT', // Nifty Next 50
    '^CNX100', // Nifty 100
    '^CRSLMID', '^NIFTYMIDCAP100', '^CNXMDCP', // Nifty Midcap 100
    'BSE-100.BO', '^BSE100', // Bse 100
    '^CRSLDX', '^CNX500', // Nifty 500
    '^CNXAUTO', // Nifty Auto
    '^CNXSMCAP', '^NIFTYSMCAP100', // Nifty Smallcap 100
    '^CNXFMCG', // Nifty FMCG
    '^CNXMETAL', // Nifty Metal
    '^CNXPHARMA', // Nifty Pharma
    '^CNXPSUBANK', // Nifty PSU Bank
    '^CNXIT', // Nifty IT
    'BSE-SMLCAP.BO', '^BSESMLCAP', // Bse Smallcap
    '^NIFTYSMCAP250', '^NIFTYSM250', // NIFTY SMALLCAP 250
    '^NIFTYMIDCAP150', '^NIFTYMID150', // NIFTY MIDCAP 150
    '^CNXCMDT', // NIFTY Commodities
    'BSE-IPO.BO', '^BSEIPO' // Bse IPO
];

async function test() {
    console.log("Starting tests...");
    for (const sym of possibleSymbols) {
        try {
            const quote = await yahooFinance.quote(sym);
            console.log(`✅ ${sym} : ${quote.shortName || quote.longName || quote.symbol}`);
        } catch (e) {
            console.log(`❌ ${sym} : NOT FOUND`);
        }
    }
    console.log("Done");
}

test();
