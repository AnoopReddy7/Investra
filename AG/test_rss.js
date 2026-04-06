const test = () => {
    const data = `<item><title><![CDATA[Sensex hits all-time high]]></title></item>`;
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(data)) !== null) {
        const itemXml = match[1];
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        console.log("Raw match:", titleMatch);
        console.log("Extracted:", titleMatch[1]);
        console.log("After replace:", titleMatch[1].replace(/<[^>]*>?/gm, '').trim());
    }
};

test();
