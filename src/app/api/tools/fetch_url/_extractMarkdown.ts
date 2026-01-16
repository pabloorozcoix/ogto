import * as cheerio from "cheerio";

export function extractMarkdownFromHtml(html: string): string {
    const $ = cheerio.load(html);

    
    $("style, script, a").remove();
    $("[style]").removeAttr("style");

    
    let main = $("main");
    if (!main.length) main = $("body");

    
    const text = main.text();

    
    let markdown = text.replace(/\n{2,}/g, "\n\n");

    
    $("h1,h2,h3,h4,h5,h6").each((_, el) => {
        const tag = el.tagName.toUpperCase();
        markdown = markdown.replace($(el).text(), `#${"#".repeat(Number(tag[1]) - 1)} ${$(el).text()}`);
    });

    return markdown.trim();
}
