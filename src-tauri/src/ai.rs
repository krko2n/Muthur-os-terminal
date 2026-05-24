use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::fs;
use std::path::PathBuf;

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

#[derive(Debug, Deserialize)]
struct Config {
    ai: Option<AiConfig>,
}

#[derive(Debug, Deserialize)]
struct AiConfig {
    model: Option<String>,
    base_url: Option<String>,
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
        let home = std::env::var("HOME").ok()?;
        let path = PathBuf::from(home)
            .join(".config")
            .join("muthur")
            .join("config.toml");

        if path.exists() {
            Some(path)
        } else {
            None
        }
    }

    pub async fn suggest_command(&self, context: &str, error: Option<&str>) -> anyhow::Result<String> {
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

    pub async fn chat(&self, message: &str) -> anyhow::Result<String> {
        let prompt = format!(
            "You are MUTHUR, an AI assistant integrated into a sci-fi terminal interface. \
             Keep responses concise and technical. User message: {}",
            message
        );

        self.generate(&prompt).await
    }

    async fn generate(&self, prompt: &str) -> anyhow::Result<String> {
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let response = self.client
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
