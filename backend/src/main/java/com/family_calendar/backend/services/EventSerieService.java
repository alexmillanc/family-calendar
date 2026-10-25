package com.family_calendar.backend.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.family_calendar.backend.entities.Event;
import com.family_calendar.backend.entities.EventSerie;
import com.family_calendar.backend.model.constants.Frequency;
import com.family_calendar.backend.repositories.IEventSerieRepository;

@Service 
public class EventSerieService {

    @Autowired 
    private IEventSerieRepository eventSerieRepository;

    public EventSerie save(EventSerie eventSerie) {
        return eventSerieRepository.save(eventSerie);
    }

    public List<Event> createOcurrences(Event event) {
        List<Event> ocurrences = new ArrayList<>();
        EventSerie eventSerie = event.getEventSerie();
        
        if (eventSerie == null) {
            return ocurrences;
        }

        LocalDateTime startDate = eventSerie.getStartDate();
        LocalDateTime endDate = eventSerie.getEndDate();
        Frequency frequency = eventSerie.getFrequency();
        int interval = eventSerie.getInterval();

        if (startDate == null || endDate == null || frequency == null || interval < 1 || startDate.isAfter(endDate)) {
            return ocurrences;
        }

        Duration duration = event.getStartDate() != null && event.getEndDate() != null
                ? Duration.between(event.getStartDate(), event.getEndDate())
                : null;

        LocalDateTime cursor = startDate;

        while (!cursor.isAfter(endDate)) {
            LocalDateTime occurrenceEnd = duration == null ? null : cursor.plus(duration);
            
            Event occurrence = new Event(
                    event.getTitle(),
                    event.getDescription(),
                    cursor,
                    occurrenceEnd,
                    event.getAddress(),
                    event.getUser(),
                    event.getColor(),
                    event.isAllDay());

            occurrence.setEventSerie(eventSerie);
            ocurrences.add(occurrence);
            cursor = nextDate(cursor, frequency, interval);
        }

        return ocurrences;
    }

    private LocalDateTime nextDate(LocalDateTime current, Frequency frequency, int interval) {
        return switch (frequency) {
            case WEEKLY -> current.plusWeeks(interval);
            case MONTHLY -> current.plusMonths(interval);
            case YEARLY -> current.plusYears(interval);
        };
    }

}