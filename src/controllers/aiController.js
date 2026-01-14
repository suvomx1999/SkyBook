const axios = require('axios');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');

const buildSystemPrompt = () => {
  return 'You are an AI travel assistant inside a flight booking app called SkyBook. You help users find flights and understand their bookings. Keep answers short, clear, and specific to flights and bookings.';
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

  const cityRegex = /(?:from|from)\s+([a-zA-Z\s]+)\s+(?:to)\s+([a-zA-Z\s]+)/;
  const match = lower.match(cityRegex);

  if (match) {
    query.source = { $regex: match[1].trim(), $options: 'i' };
    query.destination = { $regex: match[2].trim(), $options: 'i' };
  }

  const flights = await Flight.find(query).limit(5);

  if (!flights.length) {
    return '';
  }

  const lines = flights.map((f) => {
    return `Flight ${f.flightNumber} (${f.airline}): ${f.source} -> ${f.destination}, departs ${f.departureTime.toISOString()}, price ${f.price}`;
  });

  return `Some available flights that might be relevant:\n${lines.join('\n')}`;
};

const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    const systemPrompt = buildSystemPrompt();
    const userContext = req.user ? await buildUserContext(req.user.id) : '';
    const flightsContext = await buildFlightsContext(message);

    const systemParts = [systemPrompt];

    if (userContext) {
      systemParts.push(userContext);
    }

    if (flightsContext) {
      systemParts.push(flightsContext);
    }

    const systemMessage = systemParts.join('\n\n');

    const apiKey = process.env.GROQ_API_KEY;
    const modelId = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (apiKey) {
      try {
        const messages = [
          {
            role: 'system',
            content: systemMessage,
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

    if (flightsContext) {
      fallbackReply = `Based on your question, here are some flights that might help:\n\n${flightsContext}`;
    } else if (userContext) {
      fallbackReply = `${userContext}\n\nYou can ask things like:\n- "Is there a cheaper option for this route?"\n- "What are my upcoming flights?"`;
    } else {
      fallbackReply =
        'I can help you with flights and bookings in SkyBook. Try asking things like:\n- "Cheap flights from Mumbai to Delhi tomorrow under 5000"\n- "What are my upcoming bookings?"';
    }

    res.status(200).json({
      reply: fallbackReply,
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
