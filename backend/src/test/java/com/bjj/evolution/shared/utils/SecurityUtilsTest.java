package com.bjj.evolution.shared.utils;

import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityUtilsTest {

    private UserProfile createUserWithRole(UserRole role) {
        UserProfile user = new UserProfile();
        user.setRole(role);
        return user;
    }

    //region isAdmin Tests
    @Test
    void isAdmin_whenProfileIsAdmin_shouldReturnTrue() {
        UserProfile adminProfile = createUserWithRole(UserRole.ADMIN);
        assertThat(SecurityUtils.isAdmin(adminProfile)).isTrue();
    }

    @Test
    void isAdmin_whenProfileIsManager_shouldReturnFalse() {
        UserProfile managerProfile = createUserWithRole(UserRole.PLATFORM_MANAGER);
        assertThat(SecurityUtils.isAdmin(managerProfile)).isFalse();
    }

    @Test
    void isAdmin_whenProfileIsNull_shouldReturnFalse() {
        assertThat(SecurityUtils.isAdmin(null)).isFalse();
    }
    //endregion

    //region isManager Tests
    @Test
    void isManager_whenProfileIsManager_shouldReturnTrue() {
        UserProfile managerProfile = createUserWithRole(UserRole.PLATFORM_MANAGER);
        assertThat(SecurityUtils.isPlatformManager(managerProfile)).isTrue();
    }

    @Test
    void isManager_whenProfileIsAdmin_shouldReturnFalse() {
        UserProfile adminProfile = createUserWithRole(UserRole.ADMIN);
        assertThat(SecurityUtils.isPlatformManager(adminProfile)).isFalse();
    }

    @Test
    void isManager_whenProfileIsNull_shouldReturnFalse() {
        assertThat(SecurityUtils.isPlatformManager(null)).isFalse();
    }
    //endregion

    //region isAdminOrManager Tests
    @Test
    void isAdminOrManager_whenProfileIsAdmin_shouldReturnTrue() {
        UserProfile adminProfile = createUserWithRole(UserRole.ADMIN);
        assertThat(SecurityUtils.isAdminOrPlatformManager(adminProfile)).isTrue();
    }

    @Test
    void isAdminOrManager_whenProfileIsManager_shouldReturnTrue() {
        UserProfile managerProfile = createUserWithRole(UserRole.PLATFORM_MANAGER);
        assertThat(SecurityUtils.isAdminOrPlatformManager(managerProfile)).isTrue();
    }

    @Test
    void isAdminOrManager_whenProfileIsNull_shouldReturnFalse() {
        assertThat(SecurityUtils.isAdminOrPlatformManager(null)).isFalse();
    }
    //endregion
}
