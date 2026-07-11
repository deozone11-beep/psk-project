package com.psk.builders.repository;
import com.psk.builders.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    List<AppUser> findByRoleOrderByDisplayName(AppUser.Role role);
}
