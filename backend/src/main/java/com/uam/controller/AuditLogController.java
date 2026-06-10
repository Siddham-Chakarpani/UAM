package com.uam.controller;

import com.uam.model.AuditLog;
import com.uam.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Audit", description = "Audit log queries and export")
public class AuditLogController {

    private final AuditLogService auditService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ── GET /api/audit ──────────────────────────────────────────────────────
    @GetMapping("/api/audit")
    @Operation(summary = "Retrieve paginated and filtered audit logs")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('AUDIT_READ')")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @Parameter(description = "ISO-8601 datetime")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        Page<AuditLog> pg = auditService.findWithFilters(
            blankToNull(username), blankToNull(eventType), blankToNull(status),
            startDate, endDate,
            PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "timestamp"))
        );

        return ResponseEntity.ok(Map.of(
            "content",       pg.getContent(),
            "totalElements", pg.getTotalElements(),
            "totalPages",    pg.getTotalPages(),
            "currentPage",   pg.getNumber(),
            "pageSize",      pg.getSize()
        ));
    }

    // ── GET /api/audit/export (CSV) ─────────────────────────────────────────
    @GetMapping("/api/audit/export")
    @Operation(summary = "Export audit logs as CSV (default) or PDF")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "csv") String format,
            Principal principal) throws Exception {

        List<AuditLog> logs = auditService.findAllWithFilters(
            blankToNull(username), blankToNull(eventType), blankToNull(status), startDate, endDate);

        if (principal != null) {
            auditService.log("DATA_EXPORTED", principal.getName(),
                "Exported " + logs.size() + " audit logs as " + format.toUpperCase(),
                AuditLog.EventStatus.SUCCESS, "INFO");
        }

        if ("pdf".equalsIgnoreCase(format)) {
            return buildPdfResponse(logs);
        }
        return buildCsvResponse(logs);
    }

    // ── Kept for backward compat ─────────────────────────────────────────────
    @GetMapping("/api/audit-logs")
    @Operation(summary = "Alias for /api/audit (legacy)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('AUDIT_READ')")
    public ResponseEntity<Map<String, Object>> getAuditLogsLegacy(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return getAuditLogs(page, size, username, eventType, status, startDate, endDate);
    }

    @GetMapping("/api/audit-logs/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<byte[]> exportCsvLegacy(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Principal principal) throws Exception {
        return export(username, eventType, status, startDate, endDate, "csv", principal);
    }

    @GetMapping("/api/audit-logs/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_EXPORT')")
    public ResponseEntity<byte[]> exportPdfLegacy(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Principal principal) throws Exception {
        return export(username, eventType, status, startDate, endDate, "pdf", principal);
    }

    // ── CSV builder ──────────────────────────────────────────────────────────
    private ResponseEntity<byte[]> buildCsvResponse(List<AuditLog> logs) throws Exception {
        StringWriter sw = new StringWriter();
        CSVPrinter p = new CSVPrinter(sw, CSVFormat.DEFAULT.builder()
            .setHeader("ID","Event Type","Username","IP Address","Entity Type",
                       "Description","Status","Severity","Timestamp")
            .build());
        for (AuditLog l : logs) {
            p.printRecord(l.getId(), l.getEventType(), l.getUsername(), l.getIpAddress(),
                l.getEntityType(), l.getDescription(), l.getStatus(), l.getSeverity(),
                l.getTimestamp() != null ? l.getTimestamp().format(FMT) : "");
        }
        p.flush();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-logs.csv")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(sw.toString().getBytes());
    }

    // ── PDF builder ──────────────────────────────────────────────────────────
    private ResponseEntity<byte[]> buildPdfResponse(List<AuditLog> logs) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new BaseColor(30, 41, 59));
        Paragraph title = new Paragraph("UAM — Audit Log Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6f);
        doc.add(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.GRAY);
        Paragraph gen = new Paragraph("Generated: " + LocalDateTime.now().format(FMT)
            + "   |   Total Records: " + logs.size(), subFont);
        gen.setAlignment(Element.ALIGN_CENTER);
        gen.setSpacingAfter(16f);
        doc.add(gen);

        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.8f, 1.8f, 1.4f, 1.4f, 1.2f, 3f, 1f, 2f});

        Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BaseColor.WHITE);
        BaseColor hBg = new BaseColor(30, 41, 59);
        for (String h : new String[]{"ID","Event","User","IP","Entity","Description","Status","Timestamp"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, hFont));
            c.setBackgroundColor(hBg);
            c.setPadding(5f);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(c);
        }

        Font dFont = FontFactory.getFont(FontFactory.HELVETICA, 7, BaseColor.DARK_GRAY);
        boolean alt = false;
        for (AuditLog l : logs) {
            BaseColor bg = alt ? new BaseColor(248, 250, 252) : BaseColor.WHITE;
            String[] row = {
                String.valueOf(l.getId()), l.getEventType(), l.getUsername(),
                l.getIpAddress(), l.getEntityType(), l.getDescription(),
                l.getStatus() != null ? l.getStatus().name() : "",
                l.getTimestamp() != null ? l.getTimestamp().format(FMT) : ""
            };
            for (String v : row) {
                PdfPCell c = new PdfPCell(new Phrase(v != null ? v : "", dFont));
                c.setBackgroundColor(bg);
                c.setPadding(4f);
                table.addCell(c);
            }
            alt = !alt;
        }
        doc.add(table);
        doc.close();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-logs.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(out.toByteArray());
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
