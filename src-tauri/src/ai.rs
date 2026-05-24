use serde::{Deserialize, Serialize};
use reqwest::Client;

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

pub struct OllamaClient {
    base_url: String,
    client: Client,
    model: String,
}

impl OllamaClient {
    pub fn new(base_url: &str) -> Self {
        OllamaClient {
            base_url: base_url.to_string(),
            client: Client::new(),
            model: "llama3.2".to_string(),
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
