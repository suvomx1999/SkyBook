const axios = require('axios');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');

const buildSystemPrompt = () => {
  return 'You are an AI travel assistant inside a flight booking app called SkyBook. You help users find the best flights and understand their bookings. Keep answers short, clear, and specific to flights and bookings. Always consider the user message, any recent bookings, and any matching flights when giving your answer. When you see flight options, pick and explain the top 2-3 that best match the user request instead of listing everything. If there is not enough information, ask a short follow-up question instead of guessing.';
};

const cleanCityText = (text) => {
  if (!text) return '';
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return '';

  const dateKeywords = [
    'on',
    'today',
    'tomorrow',
    'tonight',
    'yesterday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const priceKeywords = [
    'under',
    'below',
    'less',
    'than',
    'upto',
    'up',
    'around',
    'about',
  ];

  const rawParts = trimmed.split(/\s+/);
  const parts = [];

  for (const token of rawParts) {
    if (priceKeywords.includes(token) || /^\d/.test(token)) {
      break;
    }
    parts.push(token);
  }

  while (parts.length && dateKeywords.includes(parts[parts.length - 1])) {
    parts.pop();
  }

  return parts.join(' ');
};

const parseExplicitDate = (text) => {
  if (!text || typeof text !== 'string') return null;

  const lower = text.toLowerCase();

  const monthMap = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const dateRegex = /on\s+(\d{1,2})(st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})/;
  const match = lower.match(dateRegex);

  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const monthName = match[3];
  const year = parseInt(match[4], 10);

  if (Number.isNaN(day) || Number.isNaN(year)) {
    return null;
  }

  if (monthMap[monthName] === undefined) {
    return null;
  }

  const start = new Date(year, monthMap[monthName], day);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const detectIntent = (message) => {
  const lower = message.toLowerCase();

  if (lower.includes('cancel') && (lower.includes('booking') || lower.includes('flight'))) {
    return 'cancel_booking';
  }

  if (lower.includes('my bookings') || lower.includes('upcoming flights') || lower.includes('upcoming trips')) {
    return 'upcoming_bookings';
  }

  if (
    lower.includes('cheap flights') ||
    lower.includes('find flights') ||
    lower.includes('search flights') ||
    lower.includes('flight from') ||
    lower.includes('flights from') ||
    lower.startsWith('book a flight') ||
    lower.startsWith('book flight') ||
    (lower.includes('book') && lower.includes('from') && lower.includes('to'))
  ) {
    return 'search_flights';
  }

  if (
    lower.includes('cheaper option') ||
    lower.includes('cheaper alternative') ||
    lower.includes('cheaper flight')
  ) {
    return 'cheaper_alternative';
  }

  return 'general';
};

const buildUserContext = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .populate('flight')
    .sort({ createdAt: -1 })
    .limit(5);

  if (!bookings.length) {
    return '';
  }

  const summary = bookings
    .map((b) => {
      const f = b.flight;
      if (!f) return null;
      return `Route: ${f.source} -> ${f.destination}, date: ${f.departureTime.toISOString()}, seats: ${b.seatNumbers?.length || 0}, status: ${b.status}`;
    })
    .filter(Boolean)
    .join('\n');

  return `Recent bookings for this user:\n${summary}`;
};

const buildFlightsContext = async (message) => {
  const lower = message.toLowerCase();
  const query = {};

  const cityRegex = /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/;
  const match = lower.match(cityRegex);

  if (match) {
    const from = cleanCityText(match[1]);
    const to = cleanCityText(match[2]);

    if (from) {
      query.source = { $regex: from, $options: 'i' };
    }

    if (to) {
      query.destination = { $regex: to, $options: 'i' };
    }
  }

  const priceRegex = /(under|below|less than)\s+(\d+)/;
  const priceMatch = lower.match(priceRegex);
  const filters = {};

  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[2], 10);
  }

  const mongoQuery = { ...query };

  if (filters.maxPrice) {
    mongoQuery.price = { $lte: filters.maxPrice };
  }

  const explicitDateRange = parseExplicitDate(message);

  if (explicitDateRange) {
    mongoQuery.departureTime = {
      $gte: explicitDateRange.start,
      $lt: explicitDateRange.end,
    };
  } else {
    const now = new Date();
    mongoQuery.departureTime = { $gte: now };
  }

  let flightsQuery = Flight.find(mongoQuery);

  if (filters.maxPrice) {
    flightsQuery = flightsQuery.sort({ price: 1 });
  } else {
    flightsQuery = flightsQuery.sort({ departureTime: 1 });
  }

  let flights = await flightsQuery.limit(10);

  if (!flights.length && Object.keys(query).length) {
    const fallbackQuery = { ...query };

    if (filters.maxPrice) {
      fallbackQuery.price = { $lte: filters.maxPrice };
    }

    let fallbackFlightsQuery = Flight.find(fallbackQuery);

    if (filters.maxPrice) {
      fallbackFlightsQuery = fallbackFlightsQuery.sort({ price: 1 });
    } else {
      fallbackFlightsQuery = fallbackFlightsQuery.sort({ departureTime: 1 });
    }

    flights = await fallbackFlightsQuery.limit(10);
  }

  if (!flights.length) {
    return { text: '', filters, flights: [] };
  }

  const bestFlights = flights.slice(0, 5);

  const lines = bestFlights.map((f, index) => {
    return `${index + 1}. ${f.airline} ${f.flightNumber}: ${f.source} -> ${f.destination}, departs ${f.departureTime.toISOString()}, price ${f.price}`;
  });

  let header = 'Top flight options based on the user request:';

  if (filters.maxPrice) {
    header = `Top flight options under ${filters.maxPrice} based on the user request:`;
  }

  const text = `${header}\n${lines.join('\n')}`;

  return { text, filters, flights: bestFlights };
};

const findBookingForCancel = async (userId, message) => {
  const lower = message.toLowerCase();

  if (!lower.includes('cancel')) {
    return null;
  }

  const bookings = await Booking.find({ user: userId, status: 'booked' })
    .populate('flight')
    .sort({ createdAt: -1 });

  if (!bookings.length) {
    return null;
  }

  const cityRegex = /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/;
  const match = lower.match(cityRegex);

  let candidates = bookings;

  if (match) {
    const from = cleanCityText(match[1]);
    const to = cleanCityText(match[2]);

    const filtered = bookings.filter((b) => {
      if (!b.flight) return false;
      const src = b.flight.source.toLowerCase();
      const dest = b.flight.destination.toLowerCase();

      const fromMatches = from ? src.includes(from) : true;
      const toMatches = to ? dest.includes(to) : true;

      return fromMatches && toMatches;
    });

    if (filtered.length) {
      candidates = filtered;
    }
  }

  const now = new Date();
  const future = candidates.filter((b) => b.flight && b.flight.departureTime > now);

  if (future.length) {
    return future[0];
  }

  return candidates[0];
};

const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    const intent = detectIntent(message);
    const lower = message.toLowerCase();
    const systemPrompt = buildSystemPrompt();
    const userContext = req.user ? await buildUserContext(req.user.id) : '';
    const flightsContext = await buildFlightsContext(message);

    let action = null;

    if (req.user && intent === 'cancel_booking') {
      const bookingToCancel = await findBookingForCancel(req.user.id, message);

      if (bookingToCancel) {
        const flight = bookingToCancel.flight;

        action = {
          type: 'suggest_cancel',
          bookingId: bookingToCancel._id.toString(),
          flightNumber: flight ? flight.flightNumber : undefined,
          airline: flight ? flight.airline : undefined,
          source: flight ? flight.source : undefined,
          destination: flight ? flight.destination : undefined,
          departureTime: flight ? flight.departureTime : undefined,
          status: bookingToCancel.status,
        };
      }
    } else if (
      flightsContext &&
      flightsContext.flights &&
      flightsContext.flights.length &&
      (lower.includes('book') ||
        lower.includes('ticket') ||
        lower.includes('reserve') ||
        lower.includes('buy flight'))
    ) {
      const bestFlight = flightsContext.flights[0];

      action = {
        type: 'suggest_booking',
        flightId: bestFlight._id.toString(),
        flightNumber: bestFlight.flightNumber,
        airline: bestFlight.airline,
        source: bestFlight.source,
        destination: bestFlight.destination,
        departureTime: bestFlight.departureTime,
        price: bestFlight.price,
      };
    }

    if (intent === 'search_flights') {
      if (flightsContext && flightsContext.flights && flightsContext.flights.length) {
        res.status(200).json({
          reply: flightsContext.text,
          action,
        });
        return;
      }

      res.status(200).json({
        reply:
          'I could not find any flights in SkyBook that match this route and budget. Try changing the cities or dates.',
      });
      return;
    }

    const systemParts = [systemPrompt, `Current intent: ${intent}`];

    if (userContext) {
      systemParts.push(userContext);
    }

    if (flightsContext && flightsContext.text) {
      systemParts.push(`Flights context:\n${flightsContext.text}`);
    }

    const systemMessage = systemParts.join('\n\n');

    const apiKey = process.env.GROQ_API_KEY;
    const modelId = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (apiKey) {
      try {
        const messages = [
          {
            role: 'system',
            content:
              `${systemMessage}\n\nYou must respond with a short, friendly explanation that directly answers the user. If you see flight data, summarise the best options instead of just listing them. If you see recent bookings, reference them when relevant.`,
          },
          {
            role: 'user',
            content: message,
          },
        ];

        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: modelId,
            messages,
            max_tokens: 256,
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const choice = response.data.choices && response.data.choices[0];

        if (choice && choice.message && choice.message.content) {
          res.status(200).json({
            reply: choice.message.content,
            action,
          });
          return;
        }
      } catch (groqError) {
        console.error(
          'Groq chat error:',
          groqError.response?.data || groqError.message || groqError
        );
      }
    }

    let fallbackReply = '';

    if (flightsContext && flightsContext.text) {
      fallbackReply = flightsContext.text;
    } else if (userContext) {
      fallbackReply = `${userContext}\n\nYou can ask things like:\n- "Is there a cheaper option for this route?"\n- "What are my upcoming flights?"`;
    } else {
      fallbackReply =
        'I can help you with flights and bookings in SkyBook. Try asking things like:\n- "Cheap flights from Mumbai to Delhi tomorrow under 5000"\n- "What are my upcoming bookings?"';
    }

    res.status(200).json({
      reply: fallbackReply,
      action,
    });
  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message || error);

    let rawMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown AI error';

    if (rawMessage && typeof rawMessage === 'object') {
      rawMessage = rawMessage.message || JSON.stringify(rawMessage);
    }

    res.status(500).json({ message: rawMessage });
  }
};

module.exports = {
  chatWithAssistant,
};
