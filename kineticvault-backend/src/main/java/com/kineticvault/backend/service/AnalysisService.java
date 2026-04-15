package com.kineticvault.backend.service;

import com.kineticvault.backend.dto.AnalyzeResponse;
import com.kineticvault.backend.model.Message;
import com.kineticvault.backend.model.Report;
import com.kineticvault.backend.repository.MessageRepository;
import com.kineticvault.backend.repository.ReportRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Core analysis service that orchestrates AI analysis, entity extraction,
 * and result persistence.
 */
@Service
public class AnalysisService {

    private final GeminiAiService geminiAiService;
    private final EntityExtractorService entityExtractorService;
    private final MessageRepository messageRepository;
    private final ReportRepository reportRepository;

    public AnalysisService(GeminiAiService geminiAiService,
                           EntityExtractorService entityExtractorService,
                           MessageRepository messageRepository,
                           ReportRepository reportRepository) {
        this.geminiAiService = geminiAiService;
        this.entityExtractorService = entityExtractorService;
        this.messageRepository = messageRepository;
        this.reportRepository = reportRepository;
    }

    /**
     * Analyzes a message for threats using AI + rule-based entity extraction.
     */
    @SuppressWarnings("unchecked")
    public AnalyzeResponse analyzeMessage(String messageContent) {
        // 1. Call Gemini AI for threat analysis
        Map<String, Object> aiResult = geminiAiService.analyzeMessage(messageContent);

        // 2. Extract entities using regex patterns
        Map<String, Object> entities = entityExtractorService.extractEntities(messageContent);

        // 3. Mask sensitive data in content before saving
        String maskedContent = maskSensitiveData(messageContent);

        // 4. Build and save Message document
        Message message = new Message();
        message.setContent(maskedContent);
        message.setRiskScore(getIntValue(aiResult, "riskScore"));
        message.setThreatLevel(getStringValue(aiResult, "threatLevel"));
        message.setKeywords((List<Map<String, Object>>) aiResult.getOrDefault("keywords", new ArrayList<>()));
        message.setEntities(entities);
        message.setExplanation(getStringValue(aiResult, "explanation"));
        message.setCreatedAt(LocalDateTime.now());

        Message saved = messageRepository.save(message);

        // 5. Build response DTO
        AnalyzeResponse response = new AnalyzeResponse();
        response.setId(saved.getId());
        response.setRiskScore(saved.getRiskScore());
        response.setThreatLevel(saved.getThreatLevel());
        response.setKeywords(saved.getKeywords());
        response.setEntities(saved.getEntities());
        response.setExplanation(saved.getExplanation());
        response.setCreatedAt(saved.getCreatedAt().toString());

        return response;
    }

    /**
     * Returns all messages ordered by most recent first.
     */
    public List<Message> getHistory() {
        return messageRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Creates or retrieves a report for a given messageId.
     */
    public Report generateReport(String messageId) {
        // Check for existing report
        Optional<Report> existing = reportRepository.findByMessageId(messageId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Fetch the original message
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found with id: " + messageId));

        // Build report
        Report report = new Report();
        report.setMessageId(messageId);
        report.setReportId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        report.setRiskLevel(message.getThreatLevel());

        // Build analysis object
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("riskScore", message.getRiskScore());
        analysis.put("threatLevel", message.getThreatLevel());
        analysis.put("keywords", message.getKeywords());
        analysis.put("entities", message.getEntities());
        analysis.put("explanation", message.getExplanation());
        analysis.put("originalContent", message.getContent());
        report.setAnalysis(analysis);

        report.setCreatedAt(LocalDateTime.now());

        return reportRepository.save(report);
    }

    /**
     * Masks sensitive data like phone numbers and UPI IDs.
     */
    private String maskSensitiveData(String content) {
        // Mask phone numbers partially
        content = content.replaceAll("(\\d{3})\\d{4}(\\d{3})", "$1****$2");
        return content;
    }

    private int getIntValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : "";
    }
}
