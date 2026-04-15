package com.kineticvault.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class GeminiAiService {
    private static final Logger logger = LoggerFactory.getLogger(GeminiAiService.class);
    private static final String DEFAULT_GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String apiUrl;

    public GeminiAiService(WebClient.Builder webClientBuilder,
                           ObjectMapper objectMapper,
                           @Value("${gemini.api.key:}") String apiKey,
                           @Value("${gemini.api.url:}") String apiUrl) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.apiUrl = apiUrl == null || apiUrl.isBlank() ? DEFAULT_GEMINI_API_URL : apiUrl;
    }

    /**
     * Analyzes a message using Gemini API and returns structured threat analysis.
     */
    public Map<String, Object> analyzeMessage(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            logger.warn("Gemini API key is not configured. Returning fallback analysis.");
            return getDefaultAnalysis("Gemini API key is not configured. Set gemini.api.key to enable AI analysis.");
        }

        try {
            String prompt = buildAnalysisPrompt(message);

            // Build request body for Gemini
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            content.put("parts", parts);
            contents.add(content);
            requestBody.put("contents", contents);

            // Generation config for JSON output
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.3);
            generationConfig.put("topP", 0.8);
            generationConfig.put("maxOutputTokens", 2048);
            requestBody.put("generationConfig", generationConfig);

            String fullUrl = apiUrl + "?key=" + apiKey;

            String responseBody = webClient.post()
                    .uri(fullUrl)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseGeminiResponse(responseBody);

        } catch (Exception e) {
            logger.error("Gemini API error: {}", e.getMessage(), e);
            return getDefaultAnalysis("Unable to analyze the message right now. Please try again.");
        }
    }

    private String buildAnalysisPrompt(String message) {
        return """
                You are a cybersecurity AI assistant. Analyze the following message for potential scam, phishing, or fraud indicators.
                
                Message to analyze:
                \"\"\"
                %s
                \"\"\"
                
                Respond ONLY with a valid JSON object (no markdown, no code blocks) with this exact structure:
                {
                  "riskScore": <integer 0-100>,
                  "threatLevel": "<NONE|LOW|MEDIUM|HIGH|CRITICAL>",
                  "keywords": [
                    {"word": "<suspicious word/phrase>", "confidence": <integer 0-100>, "type": "<urgency|phishing|financial|threat|social_engineering|impersonation>"}
                  ],
                  "explanation": "<detailed explanation of why this message is or isn't a scam, including specific patterns detected>"
                }
                
                Rules:
                - riskScore 0-20: NONE threat
                - riskScore 21-40: LOW threat
                - riskScore 41-60: MEDIUM threat
                - riskScore 61-80: HIGH threat
                - riskScore 81-100: CRITICAL threat
                - Always provide at least one keyword if riskScore > 20
                - Be thorough in your explanation
                """.formatted(message);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode textNode = candidates.get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text");

                String text = textNode.asText().trim();

                // Clean up if wrapped in code blocks
                if (text.startsWith("```json")) {
                    text = text.substring(7);
                }
                if (text.startsWith("```")) {
                    text = text.substring(3);
                }
                if (text.endsWith("```")) {
                    text = text.substring(0, text.length() - 3);
                }
                text = text.trim();

                return objectMapper.readValue(text, Map.class);
            }

            return getDefaultAnalysis("Unable to analyze the message right now. Please try again.");

        } catch (Exception e) {
            logger.error("Error parsing Gemini response: {}", e.getMessage(), e);
            return getDefaultAnalysis("Unable to parse the AI response. Please try again.");
        }
    }

    private Map<String, Object> getDefaultAnalysis() {
        return getDefaultAnalysis("Unable to analyze the message. Please try again.");
    }

    private Map<String, Object> getDefaultAnalysis(String explanation) {
        Map<String, Object> result = new HashMap<>();
        result.put("riskScore", 0);
        result.put("threatLevel", "NONE");
        result.put("keywords", new ArrayList<>());
        result.put("explanation", explanation);
        return result;
    }
}
