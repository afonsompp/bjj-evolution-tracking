-- Run this script manually on the database before deploying the new backend version.

CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id      UUID,
    academy_id    UUID,
    action        VARCHAR(80)  NOT NULL,
    resource_type VARCHAR(40),
    resource_id   VARCHAR(80),
    payload       JSONB,
    ip_address    VARCHAR(45),
    user_agent    TEXT
);

CREATE INDEX ON audit_log (academy_id, occurred_at DESC);
CREATE INDEX ON audit_log (actor_id,   occurred_at DESC);
