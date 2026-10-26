"""Asynchronous Event Bus for Internal Pub/Sub Messaging."""

import asyncio
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine, Union


@dataclass
class Event:
    """Standardized event packet."""
    event: str
    data: dict[str, Any] = field(default_factory=dict)


EventHandler = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class EventBus:
    """Decoupled async event dispatcher for streaming real-time events."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Register a coroutine handler for an event type."""
        self._subscribers[event_type].append(handler)

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """Remove a previously registered handler."""
        if handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)

    async def publish(self, event_or_type: Union[Event, str], data: dict[str, Any] | None = None) -> None:
        """Broadcast an event to all registered subscribers asynchronously."""
        if isinstance(event_or_type, Event):
            event_type = event_or_type.event
            payload_data = event_or_type.data
        else:
            event_type = event_or_type
            payload_data = data or {}

        handlers = list(self._subscribers.get(event_type, []))
        # Also notify wildcard subscribers
        handlers.extend(self._subscribers.get("*", []))

        if handlers:
            tasks = [asyncio.create_task(h({"event": event_type, "data": payload_data})) for h in handlers]
            await asyncio.gather(*tasks, return_exceptions=True)


# Global event bus singleton
event_bus = EventBus()
