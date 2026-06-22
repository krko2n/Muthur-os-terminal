use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct OfflineWikiHit {
    title: String,
    source: String,
    snippet: String,
    score: usize,
}

#[derive(Debug, Deserialize)]
struct Config {
    ai: Option<AiConfig>,
}

#[derive(Debug, Deserialize)]
struct AiConfig {
    model: Option<String>,
    base_url: Option<String>,
}

fn offline_pack_dir() -> PathBuf {
    if let Ok(path) = std::env::var("MUTHUR_OFFLINE_DIR") {
        return PathBuf::from(path);
    }

    if let Ok(path) = std::env::var("XDG_DATA_HOME") {
        return PathBuf::from(path).join("muthur").join("offline");
    }

    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));

    home.join(".local")
        .join("share")
        .join("muthur")
        .join("offline")
}

fn query_terms(query: &str) -> Vec<String> {
    let mut seen = HashSet::new();
    query
        .split(|ch: char| !ch.is_alphanumeric())
        .map(|term| term.trim().to_lowercase())
        .filter(|term| term.len() >= 3)
        .filter(|term| seen.insert(term.clone()))
        .take(14)
        .collect()
}

fn text_score(title: &str, content: &str, terms: &[String]) -> usize {
    if terms.is_empty() {
        return 0;
    }

    let title = title.to_lowercase();
    let content = content.to_lowercase();
    terms
        .iter()
        .map(|term| {
            let title_hits = title.matches(term).count() * 6;
            let body_hits = content.matches(term).count();
            title_hits + body_hits
        })
        .sum()
}

fn safe_slice(value: &str, start: usize, end: usize) -> String {
    let mut safe_start = start.min(value.len());
    let mut safe_end = end.min(value.len());
    while safe_start > 0 && !value.is_char_boundary(safe_start) {
        safe_start -= 1;
    }
    while safe_end > safe_start && !value.is_char_boundary(safe_end) {
        safe_end -= 1;
    }
    value[safe_start..safe_end].trim().replace('\n', " ")
}

fn make_snippet(content: &str, terms: &[String]) -> String {
    let lower = content.to_lowercase();
    let first_hit = terms.iter().filter_map(|term| lower.find(term)).min();
    let start = first_hit.unwrap_or(0).saturating_sub(180);
    let end = (start + 760).min(content.len());
    let mut snippet = safe_slice(content, start, end);
    if snippet.len() > 760 {
        snippet.truncate(760);
        snippet.push_str("...");
    }
    snippet
}

fn infer_title(path: &Path, content: &str) -> String {
    content
        .lines()
        .map(|line| line.trim().trim_start_matches('#').trim())
        .find(|line| line.len() >= 4 && line.len() <= 90)
        .map(|line| line.to_string())
        .or_else(|| {
            path.file_stem()
                .and_then(|name| name.to_str())
                .map(|name| name.to_string())
        })
        .unwrap_or_else(|| "offline note".to_string())
}

fn collect_searchable_files(root: &Path, depth: usize, files: &mut Vec<PathBuf>) {
    if depth > 5 || files.len() >= 240 {
        return;
    }

    let Ok(entries) = fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_searchable_files(&path, depth + 1, files);
            continue;
        }

        let searchable = path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| {
                matches!(
                    extension.to_lowercase().as_str(),
                    "md" | "txt" | "jsonl" | "json"
                )
            })
            .unwrap_or(false);

        if searchable
            && fs::metadata(&path)
                .map(|metadata| metadata.len() <= 4_000_000)
                .unwrap_or(false)
        {
            files.push(path);
        }
    }
}

fn push_hit(
    hits: &mut Vec<OfflineWikiHit>,
    title: String,
    source: String,
    content: &str,
    terms: &[String],
) {
    let score = text_score(&title, content, terms);
    if score == 0 {
        return;
    }

    hits.push(OfflineWikiHit {
        title,
        source,
        snippet: make_snippet(content, terms),
        score,
    });
}

fn search_json_lines(path: &Path, raw: &str, terms: &[String], hits: &mut Vec<OfflineWikiHit>) {
    for line in raw.lines().take(4000) {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let Ok(value) = serde_json::from_str::<Value>(trimmed) else {
            continue;
        };

        let title = value
            .get("title")
            .or_else(|| value.get("name"))
            .and_then(|field| field.as_str())
            .unwrap_or("offline wiki entry")
            .to_string();
        let text = value
            .get("text")
            .or_else(|| value.get("extract"))
            .or_else(|| value.get("content"))
            .and_then(|field| field.as_str())
            .unwrap_or("");
        let source = value
            .get("source")
            .or_else(|| value.get("url"))
            .and_then(|field| field.as_str())
            .map(|field| field.to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string());

        push_hit(hits, title, source, text, terms);
    }
}

fn search_plain_file(path: &Path, terms: &[String], hits: &mut Vec<OfflineWikiHit>) {
    let Ok(raw) = fs::read_to_string(path) else {
        return;
    };

    if path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.eq_ignore_ascii_case("jsonl"))
        .unwrap_or(false)
    {
        search_json_lines(path, &raw, terms, hits);
        return;
    }

    let title = infer_title(path, &raw);
    push_hit(hits, title, path.to_string_lossy().to_string(), &raw, terms);
}

fn collect_zim_files(root: &Path, depth: usize, files: &mut Vec<PathBuf>) {
    if depth > 4 || files.len() >= 6 {
        return;
    }

    let Ok(entries) = fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_zim_files(&path, depth + 1, files);
            continue;
        }

        if path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.eq_ignore_ascii_case("zim"))
            .unwrap_or(false)
        {
            files.push(path);
        }
    }
}

fn search_zim_with_kiwix(
    wiki_dir: &Path,
    query: &str,
    terms: &[String],
    hits: &mut Vec<OfflineWikiHit>,
) {
    let mut zim_files = Vec::new();
    collect_zim_files(wiki_dir, 0, &mut zim_files);

    for zim in zim_files {
        let Ok(output) = Command::new("kiwix-search").arg(&zim).arg(query).output() else {
            return;
        };

        if !output.status.success() {
            continue;
        }

        let raw = String::from_utf8_lossy(&output.stdout);
        for line in raw.lines().filter(|line| !line.trim().is_empty()).take(8) {
            let title = line
                .split_once('\t')
                .map(|(_, title)| title)
                .unwrap_or(line)
                .trim()
                .to_string();
            push_hit(hits, title, zim.to_string_lossy().to_string(), line, terms);
        }
    }
}

pub fn search_offline_wiki(query: &str, limit: usize) -> Vec<OfflineWikiHit> {
    let mut terms = query_terms(query);
    if terms.is_empty() {
        terms = vec![
            "survival".to_string(),
            "water".to_string(),
            "medical".to_string(),
            "power".to_string(),
            "radio".to_string(),
        ];
    }

    let pack_dir = offline_pack_dir();
    let roots = [
        pack_dir.join("wiki"),
        pack_dir.join("docs"),
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("docs"),
    ];

    let mut hits = Vec::new();
    for root in roots {
        if !root.exists() {
            continue;
        }

        let mut files = Vec::new();
        collect_searchable_files(&root, 0, &mut files);
        for file in files {
            search_plain_file(&file, &terms, &mut hits);
        }

        search_zim_with_kiwix(&root, query, &terms, &mut hits);
    }

    hits.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.title.cmp(&b.title)));
    hits.truncate(limit.max(1));
    hits
}

pub fn build_offline_wiki_context(query: &str, limit: usize) -> Option<String> {
    let hits = search_offline_wiki(query, limit);
    if hits.is_empty() {
        return None;
    }

    let mut context = String::from("OFFLINE ARCHIVE CONTEXT\n");
    for hit in hits {
        context.push_str(&format!(
            "\nSOURCE: {}\nTITLE: {}\nEXTRACT: {}\n",
            hit.source, hit.title, hit.snippet
        ));
    }

    if context.len() > 7000 {
        context.truncate(7000);
        context.push_str("\n[offline context truncated]");
    }

    Some(context)
}

pub struct OllamaClient {
    base_url: String,
    client: Client,
    model: String,
}

impl OllamaClient {
    pub fn new(base_url: &str) -> Self {
        let model = Self::get_model_from_config();
        let base = Self::get_base_url_from_config(base_url);

        OllamaClient {
            base_url: base,
            client: Client::new(),
            model,
        }
    }

    fn get_model_from_config() -> String {
        // 1. Check environment variable
        if let Ok(model) = std::env::var("MUTHUR_AI_MODEL") {
            return model;
        }

        // 2. Check config file
        if let Some(config_path) = Self::get_config_path() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(config) = toml::from_str::<Config>(&content) {
                    if let Some(ai) = config.ai {
                        if let Some(model) = ai.model {
                            return model;
                        }
                    }
                }
            }
        }

        // 3. Default
        "llama3.2".to_string()
    }

    fn get_base_url_from_config(default: &str) -> String {
        // Check config file for base_url
        if let Some(config_path) = Self::get_config_path() {
            if let Ok(content) = fs::read_to_string(&config_path) {
                if let Ok(config) = toml::from_str::<Config>(&content) {
                    if let Some(ai) = config.ai {
                        if let Some(url) = ai.base_url {
                            return url;
                        }
                    }
                }
            }
        }

        default.to_string()
    }

    fn get_config_path() -> Option<PathBuf> {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .ok()?;
        let path = PathBuf::from(&home)
            .join(".config")
            .join("muthur")
            .join("config.toml");

        if path.exists() {
            return Some(path);
        }

        // Windows fallback: %APPDATA%\muthur\config.toml
        if let Ok(appdata) = std::env::var("APPDATA") {
            let win_path = PathBuf::from(appdata).join("muthur").join("config.toml");
            if win_path.exists() {
                return Some(win_path);
            }
        }

        None
    }

    pub async fn suggest_command(
        &self,
        context: &str,
        error: Option<&str>,
    ) -> anyhow::Result<String> {
        let prompt = if let Some(err) = error {
            format!(
                "You are a Linux command-line assistant. The user encountered this error:\n\
                 {}\n\n\
                 Context: {}\n\n\
                 Provide ONLY the exact command to fix this, nothing else. No explanations.",
                err, context
            )
        } else {
            format!(
                "You are a Linux command-line assistant. Based on this context:\n\
                 {}\n\n\
                 Provide ONLY the exact command to execute, nothing else. No explanations.",
                context
            )
        };

        self.generate(&prompt).await
    }

    pub async fn chat(
        &self,
        message: &str,
        offline_context: Option<&str>,
    ) -> anyhow::Result<String> {
        let archive_instruction = if offline_context.is_some() {
            "Use the OFFLINE ARCHIVE CONTEXT when it is relevant. Mention the local source title briefly when useful. Do not invent details beyond the archive."
        } else {
            "No offline archive hit was available for this query. Answer from the local model's general knowledge and say when a proper offline source should be installed."
        };

        let prompt = format!(
            "You are MUTHUR, a helpful AI assistant embedded in a futuristic terminal interface. \
             You are a survival-ready offline knowledge system for a harsh, low-connectivity environment. \
             You are friendly, knowledgeable, and efficient - like a skilled copilot and field archivist. \
             You help with coding, system administration, local research, emergency planning, repairs, maps, and general questions. \
             Keep responses concise and practical (under 150 words). \
             You never use emojis. Use plain text formatting. \
             If you don't know something, say so directly. \
             You have a subtle cyberpunk/sci-fi personality - cool, calm, slightly witty. \
             {}\n\n\
             {}\n\n\
             User: {}",
            archive_instruction,
            offline_context.unwrap_or("OFFLINE ARCHIVE CONTEXT: none"),
            message
        );

        self.generate(&prompt).await
    }

    pub fn model_name(&self) -> &str {
        &self.model
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    pub async fn is_available(&self) -> bool {
        self.client
            .get(&self.base_url)
            .timeout(std::time::Duration::from_secs(2))
            .send()
            .await
            .map(|response| response.status().is_success() || response.status().is_redirection())
            .unwrap_or(false)
    }

    async fn generate(&self, prompt: &str) -> anyhow::Result<String> {
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let response = self
            .client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Ollama API error: {}", response.status()));
        }

        let ollama_response: OllamaResponse = response.json().await?;
        Ok(ollama_response.response.trim().to_string())
    }
}
