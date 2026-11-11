package com.family_calendar.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.family_calendar.backend.entities.Event;
import com.family_calendar.backend.entities.EventSerie;
import com.family_calendar.backend.repositories.IEventRepository;
import com.family_calendar.backend.repositories.IEventSerieRepository;

import jakarta.transaction.Transactional;

@Service
public class EventService {

    @Autowired
    private IEventRepository eventRepository;

    @Autowired
    private IEventSerieRepository eventSerieRepository;

    @Autowired
    private EventSerieService eventSerieService;

    // Transational to avoid that series stays in the database with no event if saving the event fails
    @Transactional
    public Event create(Event event) {
        LocalDateTime now = LocalDateTime.now();

        if (event.getCreatedAt() == null) {
            event.setCreatedAt(now);
        }

        event.setUpdatedAt(now);

        if (event.getEventSerie() != null) {
            event.setEventSerie(eventSerieService.save(event.getEventSerie()));

            // Occurrences already include the first date, so the template event is not saved again.
            List<Event> ocurrences = eventSerieService.createOcurrences(event);
            if (!ocurrences.isEmpty()) {
                Event first = null;
                for (Event occurrence : ocurrences) {
                    Event saved = eventRepository.save(occurrence);
                    if (first == null) {
                        first = saved;
                    }
                }
                return first;
            }
        }

        return eventRepository.save(event);
    }

    public List<Event> getAll() {
        return eventRepository.findAll();
    }

    public List<Event> getByUserId(int userId) {
        return eventRepository.findByUser_Id(userId);
    }

    public Event getById(int id) {
        return eventRepository.findById(id).orElse(null);
    }

    @Transactional
    public void delete(int id, boolean deleteAllEventsFromSerie) {
        Optional<Event> eventOptional = eventRepository.findById(id);
        if (eventOptional.isEmpty()) {
            return;
        }

        Event event = eventOptional.get();
        EventSerie eventSerie = event.getEventSerie();

        if (eventSerie == null) {
            eventRepository.delete(event);
            return;
        }

        int eventSerieId = eventSerie.getId();

        if (deleteAllEventsFromSerie) {
            eventRepository.deleteByEventSerie_Id(eventSerieId);
            eventSerieRepository.deleteById(eventSerieId);

        } else {
            eventRepository.delete(event);
            if (eventRepository.findByEventSerie_Id(eventSerieId).isEmpty()) {
                eventSerieRepository.deleteById(eventSerieId);
            }
        }
       
        eventRepository.flush();
    }

    public Event update(Event event) {
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

}