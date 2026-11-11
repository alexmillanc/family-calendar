package com.family_calendar.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.family_calendar.backend.entities.EventSerie;

public interface IEventSerieRepository extends JpaRepository<EventSerie, Integer> {

}
