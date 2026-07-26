package com.psk.builders.config;

import com.psk.builders.model.AppUser;
import com.psk.builders.repository.AppUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DbUserDetailsService implements UserDetailsService {

    final AppUserRepository users;

    public DbUserDetailsService(AppUserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser u = users.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("No such user: " + username));
        return User.withUsername(u.getUsername())
                .password(u.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())))
                .build();
    }
}
