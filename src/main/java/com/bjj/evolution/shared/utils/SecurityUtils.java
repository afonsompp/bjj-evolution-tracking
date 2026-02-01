package com.bjj.evolution.shared.utils;

import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;

public class SecurityUtils {

    public static boolean isAdmin(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.ADMIN;
    }

    public static boolean isAdminOrManager(UserProfile profile) {
        return isAdmin(profile) || isManager(profile);
    }

    public static boolean isNotAdminOrManager(UserProfile profile) {
        return !isNotAdminOrManager(profile);
    }

    public static boolean isManager(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.MANAGER;
    }

    public static boolean isAcademyOwner(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.ACADEMY_OWNER;
    }

}
