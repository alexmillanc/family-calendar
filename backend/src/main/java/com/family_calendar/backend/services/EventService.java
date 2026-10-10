package com.family_calendar.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.family_calendar.backend.entities.Event;
import com.family_calendar.backend.repositories.IEventRepository;

@Service
public class EventService {

    @Autowired
    private IEventRepository eventRepository;

    public Event save(Event event) {
        LocalDateTime now = LocalDateTime.now();
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(now);
        }
        event.setUpdatedAt(now);
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
