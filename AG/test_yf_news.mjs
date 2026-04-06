import YahooFinanceFactory from 'yahoo-finance2';
const yahooFinance = new YahooFinanceFactory();

async function test() {
    try {
        yahooFinance.suppressNotices(['yahooSurvey']);
        const result = await yahooFinance.search('NIFTY', { newsCount: 5 }, { validateResult: false });
        if (result && result.news) {
            console.log(`Successfully fetched ${result.news.length} news from YF`);
            console.log(result.news[0]);
        } else {
            console.log('No news found');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
