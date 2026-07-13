package events

import (
	"sync"
)

type StreamEvent struct {
	Type    string
	Payload interface{}
}

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	// Registered clients. The value is a channel for sending messages.
	clients map[chan *StreamEvent]bool

	// Inbound messages from the simulator/devices.
	Broadcast chan *StreamEvent

	// Register requests from the clients.
	Register chan chan *StreamEvent

	// Unregister requests from clients.
	Unregister chan chan *StreamEvent

	mu sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan *StreamEvent),
		Register:   make(chan chan *StreamEvent),
		Unregister: make(chan chan *StreamEvent),
		clients:    make(map[chan *StreamEvent]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client)
			}
			h.mu.Unlock()
		case event := <-h.Broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client <- event:
				default:
					close(client)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}
