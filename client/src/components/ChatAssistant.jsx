import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatAssistant = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat', { message: userMessage.content });
      const reply = res.data?.reply || 'I could not generate a response.';
      const action = res.data?.action || null;
      const assistantMessage = {
        id: `${userMessage.id}-assistant`,
        role: 'assistant',
        content: reply,
        action,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat assistant error:', error.response || error.message || error);
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Something went wrong while talking to the assistant.';
      const text =
        typeof serverMessage === 'string'
          ? serverMessage
          : JSON.stringify(serverMessage);
      const errorMessage = {
        id: `${userMessage.id}-error`,
        role: 'assistant',
        content: text,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, messageId) => {
    try {
      const res = await API.put(`/bookings/${bookingId}/cancel`);
      const successMessage = {
        id: `${messageId}-cancelled`,
        role: 'assistant',
        content: 'Your booking has been cancelled.',
      };

      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === messageId ? { ...m, action: null } : m
        );
        return [...updated, successMessage];
      });
    } catch (error) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to cancel booking.';
      const text =
        typeof serverMessage === 'string'
          ? serverMessage
          : JSON.stringify(serverMessage);
      const errorMessage = {
        id: `${messageId}-cancel-error`,
        role: 'assistant',
        content: text,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleBookFlight = (flightId, messageId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, action: null } : m))
    );
    navigate(`/?flightId=${flightId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">SkyBook Assistant</div>
                <div className="text-xs text-slate-500">Ask about flights or your bookings</div>
              </div>
            </div>
            <button
              onClick={toggleOpen}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 max-h-80 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-slate-500 text-xs space-y-1">
                <div>
                  You can ask things like
                  {' '}
                  <span className="font-medium text-slate-700">
                    cheap flights from Mumbai to Delhi this weekend
                  </span>
                  .
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setInput('Show my upcoming flights')}
                    className="px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Show my upcoming flights
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput('Find cheaper option for my current booking')}
                    className="px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Find cheaper option for my booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setInput('Find flights from Singapore to Sydney tomorrow under 700')}
                    className="px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Flights from Singapore to Sydney tomorrow
                  </button>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && m.action?.type === 'suggest_cancel' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(m.action.bookingId, m.id)}
                      className="mt-1 self-start text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Cancel this booking
                    </button>
                  )}
                  {m.role === 'assistant' && m.action?.type === 'suggest_booking' && (
                    <button
                      type="button"
                      onClick={() => handleBookFlight(m.action.flightId, m.id)}
                      className="mt-1 self-start text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Book this flight
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-400">
                Assistant is thinking
                {' '}
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 px-3 py-2 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something about flights"
              className="flex-1 text-sm px-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={toggleOpen}
        className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ChatAssistant;
