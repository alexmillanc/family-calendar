package com.family_calendar.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.family_calendar.backend.entities.User;

public interface IUserRepository extends JpaRepository<User, Integer> {

    public User findByUsername(String username);

}
