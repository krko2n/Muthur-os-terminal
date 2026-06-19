use scraper::{ElementRef, Html, Selector};
use serde::Serialize;

const MAX_BLOCKS: usize = 500;
const MAX_DEPTH: usize = 20;
const MAX_HTML_BYTES: usize = 5 * 1024 * 1024;

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum TextBlock {
    Heading {
        level: u8,
        text: String,
    },
    Paragraph {
        text: String,
    },
    Link {
        id: usize,
        text: String,
        url: String,
    },
    BulletList {
        items: Vec<String>,
    },
    OrderedList {
        items: Vec<String>,
    },
    CodeBlock {
        code: String,
    },
    Table {
        headers: Vec<String>,
        rows: Vec<Vec<String>>,
    },
    Image {
        alt: String,
        url: String,
    },
    BlockQuote {
        text: String,
    },
    Separator,
}

#[derive(Serialize, Clone, Debug)]
pub struct LinkRef {
    pub id: usize,
    pub url: String,
    pub text: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct BrowserDocument {
    pub title: String,
    pub url: String,
    pub blocks: Vec<TextBlock>,
    pub links: Vec<LinkRef>,
}

pub fn parse_html(html: &str, base_url: &str) -> BrowserDocument {
    let html = if html.len() > MAX_HTML_BYTES {
        &html[..MAX_HTML_BYTES]
    } else {
        html
    };

    let document = Html::parse_document(html);

    let title = Selector::parse("title")
        .ok()
        .and_then(|sel| document.select(&sel).next())
        .map(|el| el.text().collect::<String>().trim().to_string())
        .unwrap_or_else(|| "Untitled".to_string());

    let mut blocks = Vec::new();
    let mut links = Vec::new();
    let mut link_id: usize = 1;

    // Walk the <body> if present, otherwise root
    let body_sel = Selector::parse("body").ok();
    let root = body_sel
        .as_ref()
        .and_then(|sel| document.select(sel).next());

    if let Some(body) = root {
        process_children(&body, &mut blocks, &mut links, &mut link_id, base_url, 0);
    } else {
        // Fallback: walk entire document
        if let Some(root_el) = document
            .root_element()
            .children()
            .filter_map(ElementRef::wrap)
            .next()
        {
            process_children(&root_el, &mut blocks, &mut links, &mut link_id, base_url, 0);
        }
    }

    BrowserDocument {
        title,
        url: base_url.to_string(),
        blocks,
        links,
    }
}

fn process_children(
    parent: &ElementRef,
    blocks: &mut Vec<TextBlock>,
    links: &mut Vec<LinkRef>,
    link_id: &mut usize,
    base_url: &str,
    depth: usize,
) {
    if depth > MAX_DEPTH || blocks.len() >= MAX_BLOCKS {
        return;
    }

    for child in parent.children() {
        if blocks.len() >= MAX_BLOCKS {
            break;
        }

        if let Some(elem) = ElementRef::wrap(child) {
            process_element(&elem, blocks, links, link_id, base_url, depth + 1);
        } else if let Some(text) = child.value().as_text() {
            let trimmed = text.trim().to_string();
            if !trimmed.is_empty() && depth > 1 {
                blocks.push(TextBlock::Paragraph { text: trimmed });
            }
        }
    }
}

fn process_element(
    elem: &ElementRef,
    blocks: &mut Vec<TextBlock>,
    links: &mut Vec<LinkRef>,
    link_id: &mut usize,
    base_url: &str,
    depth: usize,
) {
    if depth > MAX_DEPTH || blocks.len() >= MAX_BLOCKS {
        return;
    }

    let tag = elem.value().name();

    // Skip invisible elements
    match tag {
        "script" | "style" | "noscript" | "template" | "svg" | "nav" | "footer" | "header" => {
            return
        }
        _ => {}
    }

    match tag {
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
            let level = tag.as_bytes()[1] - b'0';
            let text = collect_text(elem).trim().to_string();
            if !text.is_empty() {
                blocks.push(TextBlock::Heading { level, text });
            }
        }
        "p" => {
            let text = collect_inline_text(elem, links, link_id, base_url);
            if !text.is_empty() {
                blocks.push(TextBlock::Paragraph { text });
            }
        }
        "a" => {
            let href = elem.value().attr("href").unwrap_or("");
            let url = resolve_url(href, base_url);
            let text = collect_text(elem).trim().to_string();
            if !text.is_empty() && !url.is_empty() {
                blocks.push(TextBlock::Link {
                    id: *link_id,
                    text: text.clone(),
                    url: url.clone(),
                });
                links.push(LinkRef {
                    id: *link_id,
                    url,
                    text,
                });
                *link_id += 1;
            }
        }
        "img" => {
            let alt = elem.value().attr("alt").unwrap_or("image").to_string();
            let src = elem.value().attr("src").unwrap_or("");
            let url = resolve_url(src, base_url);
            if !url.is_empty() {
                blocks.push(TextBlock::Image { alt, url });
            }
        }
        "ul" => {
            let items = collect_list_items(elem);
            if !items.is_empty() {
                blocks.push(TextBlock::BulletList { items });
            }
        }
        "ol" => {
            let items = collect_list_items(elem);
            if !items.is_empty() {
                blocks.push(TextBlock::OrderedList { items });
            }
        }
        "table" => {
            let (headers, rows) = collect_table(elem);
            if !headers.is_empty() || !rows.is_empty() {
                blocks.push(TextBlock::Table { headers, rows });
            }
        }
        "pre" | "code" => {
            let code = elem.text().collect::<String>();
            if !code.is_empty() {
                blocks.push(TextBlock::CodeBlock { code });
            }
        }
        "blockquote" => {
            let text = collect_text(elem).trim().to_string();
            if !text.is_empty() {
                blocks.push(TextBlock::BlockQuote { text });
            }
        }
        "hr" => {
            blocks.push(TextBlock::Separator);
        }
        // Container elements: recurse into children
        "div" | "section" | "article" | "main" | "span" | "aside" | "figure" | "figcaption"
        | "details" | "summary" | "dl" | "dd" | "dt" | "form" | "fieldset" | "label" => {
            process_children(elem, blocks, links, link_id, base_url, depth);
        }
        "li" => {
            // Standalone li outside a list context - treat as paragraph
            let text = collect_text(elem).trim().to_string();
            if !text.is_empty() {
                blocks.push(TextBlock::Paragraph { text });
            }
        }
        _ => {
            // Unknown elements: recurse
            process_children(elem, blocks, links, link_id, base_url, depth);
        }
    }
}

fn collect_text(elem: &ElementRef) -> String {
    elem.text().collect::<Vec<_>>().join(" ")
}

fn collect_inline_text(
    elem: &ElementRef,
    links: &mut Vec<LinkRef>,
    link_id: &mut usize,
    base_url: &str,
) -> String {
    let mut parts = Vec::new();

    for child in elem.children() {
        if let Some(child_elem) = ElementRef::wrap(child) {
            let tag = child_elem.value().name();
            match tag {
                "a" => {
                    let href = child_elem.value().attr("href").unwrap_or("");
                    let url = resolve_url(href, base_url);
                    let text = collect_text(&child_elem).trim().to_string();
                    if !text.is_empty() && !url.is_empty() {
                        parts.push(format!("[{}] {}", link_id, text));
                        links.push(LinkRef {
                            id: *link_id,
                            url,
                            text,
                        });
                        *link_id += 1;
                    }
                }
                "strong" | "b" => {
                    let text = collect_text(&child_elem).trim().to_string();
                    if !text.is_empty() {
                        parts.push(format!("*{}*", text));
                    }
                }
                "em" | "i" => {
                    let text = collect_text(&child_elem).trim().to_string();
                    if !text.is_empty() {
                        parts.push(format!("_{}_", text));
                    }
                }
                "code" => {
                    let text = collect_text(&child_elem);
                    if !text.is_empty() {
                        parts.push(format!("`{}`", text));
                    }
                }
                "br" => {
                    parts.push("\n".to_string());
                }
                _ => {
                    let text = collect_text(&child_elem).trim().to_string();
                    if !text.is_empty() {
                        parts.push(text);
                    }
                }
            }
        } else if let Some(text) = child.value().as_text() {
            let trimmed = text.trim();
            if !trimmed.is_empty() {
                parts.push(trimmed.to_string());
            }
        }
    }

    parts.join(" ")
}

fn collect_list_items(elem: &ElementRef) -> Vec<String> {
    Selector::parse("li")
        .ok()
        .map(|sel| {
            elem.select(&sel)
                .map(|li| collect_text(&li).trim().to_string())
                .filter(|t| !t.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

fn collect_table(elem: &ElementRef) -> (Vec<String>, Vec<Vec<String>>) {
    let headers: Vec<String> = Selector::parse("th")
        .ok()
        .map(|sel| {
            elem.select(&sel)
                .map(|th| collect_text(&th).trim().to_string())
                .collect()
        })
        .unwrap_or_default();

    let rows: Vec<Vec<String>> = Selector::parse("tr")
        .ok()
        .map(|tr_sel| {
            elem.select(&tr_sel)
                .filter_map(|tr| {
                    let cells: Vec<String> = Selector::parse("td")
                        .ok()
                        .map(|td_sel| {
                            tr.select(&td_sel)
                                .map(|td| collect_text(&td).trim().to_string())
                                .collect()
                        })
                        .unwrap_or_default();
                    if cells.is_empty() {
                        None
                    } else {
                        Some(cells)
                    }
                })
                .collect()
        })
        .unwrap_or_default();

    (headers, rows)
}

fn resolve_url(href: &str, base_url: &str) -> String {
    let href = href.trim();

    if href.is_empty() || href.starts_with('#') || href.starts_with("javascript:") {
        return String::new();
    }

    if href.starts_with("http://") || href.starts_with("https://") {
        return href.to_string();
    }

    if href.starts_with("//") {
        return format!("https:{}", href);
    }

    // Relative URL resolution
    if let Some(base_end) = base_url.rfind('/') {
        if href.starts_with('/') {
            // Absolute path relative to origin
            if let Some(origin_end) = base_url.find("://").map(|i| {
                base_url[i + 3..]
                    .find('/')
                    .map(|j| i + 3 + j)
                    .unwrap_or(base_url.len())
            }) {
                return format!("{}{}", &base_url[..origin_end], href);
            }
        } else {
            // Relative path
            return format!("{}/{}", &base_url[..base_end], href);
        }
    }

    href.to_string()
}
