package com.bjj.evolution.audit.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Auditable {
    String action();
    String resourceType() default "";
    /** Positional index of the academyId (UUID) argument; -1 if not applicable. */
    int academyIdArg() default -1;
    /** Positional index of the resource-id argument; -1 if not applicable. */
    int resourceIdArg() default -1;
}
