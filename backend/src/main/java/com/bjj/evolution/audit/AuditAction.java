package com.bjj.evolution.audit;

public final class AuditAction {

    public static final String MEMBER_APPROVED  = "MEMBER_APPROVED";
    public static final String MEMBER_REJECTED  = "MEMBER_REJECTED";
    public static final String MEMBER_REMOVED   = "MEMBER_REMOVED";
    public static final String MEMBER_GRADUATED = "MEMBER_GRADUATED";
    public static final String ACADEMY_UPDATED  = "ACADEMY_UPDATED";
    public static final String ACADEMY_DELETED  = "ACADEMY_DELETED";
    public static final String TRAINING_DELETED = "TRAINING_DELETED";
    public static final String ADMIN_BYPASS     = "ADMIN_BYPASS";

    private AuditAction() {}
}
