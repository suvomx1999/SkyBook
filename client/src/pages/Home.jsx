import React, { useState, useEffect } from 'react';
import API from '../services/api';
import FlightCard from '../components/FlightCard';
import { Search, MapPin, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Home = () => {
  const [urlParams] = useSearchParams();
  const highlightedFlightId = urlParams.get('flightId');
  const [searchParams, setSearchParams] = useState({
    source: '',
    destination: '',
    date: ''
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [filterAirline, setFilterAirline] = useState('all');

  useEffect(() => {
    const fetchSingleFlight = async () => {
      if (highlightedFlightId && flights.length === 0) {
        setLoading(true);
        try {
          const res = await API.get(`/flights/${highlightedFlightId}`);
          if (res.data) {
             setFlights([res.data]);
             setSearched(true);
          }
        } catch (err) {
          console.error("Failed to fetch deep-linked flight", err);
          setError("Failed to load the specified flight.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSingleFlight();
  }, [highlightedFlightId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const getSortedAndFilteredFlights = () => {
    let result = [...flights];

    // Filter by Airline
    if (filterAirline !== 'all') {
      result = result.filter(flight => flight.airline === filterAirline);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'time_earliest') return new Date(a.departureTime) - new Date(b.departureTime);
      return 0;
    });

    return result;
  };

  const uniqueAirlines = [...new Set(flights.map(f => f.airline))];

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const { source, destination, date } = searchParams;
      const query = new URLSearchParams();
      if (source) query.append('source', source);
      if (destination) query.append('destination', destination);
      if (date) query.append('date', date);

      const res = await API.get(`/flights?${query.toString()}`);
      setFlights(res.data);
    } catch (err) {
      setError('Failed to fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightDelete = (flightId) => {
    setFlights(flights.filter(f => f._id !== flightId));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="relative bg-blue-600 h-[500px]">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Airplane background" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Explore the World with SkyBook
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl">
            Discover amazing destinations and book your next flight with ease and comfort.
          </p>
        </div>
      </div>

      {/* Search Form - Overlapping Hero */}
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="source"
                  value={searchParams.source}
                  onChange={handleChange}
                  placeholder="City (e.g. New York)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="destination"
                  value={searchParams.destination}
                  onChange={handleChange}
                  placeholder="City (e.g. London)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Search className="h-5 w-5" />
                <span>Search Flights</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 mt-12">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {flights.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 max-w-5xl mx-auto bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
              <span className="text-sm font-semibold text-slate-500">Filter by:</span>
              <select 
                value={filterAirline} 
                onChange={(e) => setFilterAirline(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value="all">All Airlines</option>
                {uniqueAirlines.map(airline => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm font-semibold text-slate-500">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="time_earliest">Departure: Earliest First</option>
              </select>
            </div>
          </div>
        )}
        
        {!loading && searched && flights.length === 0 && (
          <div className="text-center text-slate-500 mt-12 py-12 bg-white rounded-xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <div className="mb-4 bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">No flights found</h3>
            <p className="mt-2">Try adjusting your search criteria to find available flights.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mt-8 max-w-5xl mx-auto">
          {getSortedAndFilteredFlights().map((flight) => (
            <FlightCard
              key={flight._id}
              flight={flight}
              onDelete={handleFlightDelete}
              autoOpen={highlightedFlightId === flight._id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
