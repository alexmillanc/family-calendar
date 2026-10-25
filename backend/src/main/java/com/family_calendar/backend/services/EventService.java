package com.family_calendar.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.family_calendar.backend.entities.Event;
import com.family_calendar.backend.repositories.IEventRepository;

import jakarta.transaction.Transactional;

@Service
public class EventService {

    @Autowired
    private IEventRepository eventRepository;

    @Autowired 
    private EventSerieService eventSerieService;

    //  Transational to avoid that series stays in the database with no event if saving the event fails
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

    public void delete(int id) {
        Optional<Event> op = eventRepository.findById(id);
        if (op.isPresent()) {
            eventRepository.delete(op.get());
        }
    }

    public Event update(Event event) {
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

}
