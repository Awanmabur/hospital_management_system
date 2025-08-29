// helpers/jsonldHelper.js
exports.generateEventJSONLD = (event) => {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title || "Untitled Event",
    "description": event.description || "",
    "startDate": event.date ? new Date(event.date).toISOString() : undefined,
    "eventAttendanceMode": event.event_mode === "online"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": event.location || "TBA",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location || ""
      }
    },
    "image": event.image
      ? [`https://www.classicpro.events${event.image}`]
      : undefined,
    "offers": event.ticket_types && event.ticket_types.length > 0
      ? event.ticket_types.map(ticket => ({
          "@type": "Offer",
          "url": `https://www.classicpro.events/show/event/${event._id}`,
          "price": ticket.current_price || ticket.initial_price || 0,
          "priceCurrency": "USD",
          "availability": ticket.total_available - ticket.sold > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut"
        }))
      : undefined,
    "organizer": {
      "@type": "Organization",
      "name": "Classic Events Pro",
      "url": "https://www.classicpro.events"
    }
  };
};
