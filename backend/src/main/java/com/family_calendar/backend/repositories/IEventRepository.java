package com.family_calendar.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.family_calendar.backend.entities.Event;

public interface IEventRepository extends JpaRepository<Event, Integer> {

    List<Event> findByUser_Id(int userId);

}
