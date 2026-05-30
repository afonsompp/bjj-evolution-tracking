package com.bjj.evolution.notification.template;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Builds subject + HTML + plain-text bodies for each notification type, in pt-BR
 * (the primary market). Kept as Java text blocks for the MVP — the move to
 * Thymeleaf + per-locale templates is planned for the preferences phase.
 */
@Component
public class NotificationTemplates {

    private static final Locale LOCALE = Locale.forLanguageTag("pt-BR");
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("EEE, dd/MM 'às' HH:mm", LOCALE).withZone(ZONE);

    /** A rendered message body. */
    public record Rendered(String subject, String html, String text) {
    }

    public Rendered memberApproved(String academyName, String userName) {
        String subject = "Bem-vindo à " + academyName + "! 🥋";
        String text = """
                Olá, %s!

                Seu pedido para entrar na academia %s foi aprovado. Já pode acompanhar as aulas e seus treinos pela plataforma.

                Bons treinos! Oss.""".formatted(userName, academyName);
        return new Rendered(subject, wrap("Pedido aprovado", text), text);
    }

    public Rendered memberRejected(String academyName, String userName) {
        String subject = "Sobre seu pedido na " + academyName;
        String text = """
                Olá, %s!

                Seu pedido para entrar na academia %s não foi aprovado desta vez. Se achar que houve um engano, fale diretamente com a academia.

                Oss.""".formatted(userName, academyName);
        return new Rendered(subject, wrap("Pedido não aprovado", text), text);
    }

    public Rendered memberJoinRequested(String academyName, String requesterName) {
        String subject = "Novo pedido de entrada na " + academyName;
        String text = """
                Olá!

                %s pediu para entrar na academia %s. Acesse a plataforma para aprovar ou recusar o pedido.""".formatted(requesterName, academyName);
        return new Rendered(subject, wrap("Novo pedido de entrada", text), text);
    }

    public Rendered classUpdated(String academyName, Instant startTime, String instructorName) {
        String subject = "Aula atualizada — " + academyName;
        String text = """
                Olá!

                Uma aula em que você está inscrito foi atualizada:

                Academia: %s
                Início: %s
                Instrutor: %s

                Confira os detalhes na plataforma.""".formatted(academyName, formatWhen(startTime), instructorName);
        return new Rendered(subject, wrap("Aula atualizada", text), text);
    }

    public Rendered classCanceled(String academyName, Instant startTime) {
        String subject = "Aula cancelada — " + academyName;
        String text = """
                Olá!

                A aula abaixo, em que você estava inscrito, foi cancelada:

                Academia: %s
                Início previsto: %s

                Oss.""".formatted(academyName, formatWhen(startTime));
        return new Rendered(subject, wrap("Aula cancelada", text), text);
    }

    public Rendered classReminder(String academyName, Instant startTime, String instructorName) {
        String subject = "Lembrete de aula — " + academyName;
        String text = """
                Olá!

                Você tem uma aula chegando:

                Academia: %s
                Início: %s
                Instrutor: %s

                Até lá! Oss.""".formatted(academyName, formatWhen(startTime), instructorName);
        return new Rendered(subject, wrap("Lembrete de aula", text), text);
    }

    private String formatWhen(Instant instant) {
        return WHEN.format(instant);
    }

    /** Wraps a plain-text body into a simple, inline-styled HTML email. */
    private String wrap(String heading, String body) {
        String paragraphs = body.lines()
                .map(line -> line.isBlank()
                        ? "<div style=\"height:12px\"></div>"
                        : "<p style=\"margin:0 0 8px;line-height:1.5\">" + escape(line) + "</p>")
                .reduce("", (a, b) -> a + b);
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18181b">
                  <h2 style="margin:0 0 16px;color:#863bff">%s</h2>
                  %s
                  <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
                  <p style="margin:0;font-size:12px;color:#71717a">BJJ Evolution</p>
                </div>""".formatted(escape(heading), paragraphs);
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
