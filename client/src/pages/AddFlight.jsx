import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Plane, Calendar, MapPin, IndianRupee, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const AddFlight = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    source: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    totalSeats: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await API.post('/flights', formData);
      setSuccess('Flight created successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create flight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Plane className="h-8 w-8" />
              Add New Flight
            </h1>
            <p className="text-blue-100 mt-2">Enter flight details to schedule a new journey.</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Flight Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Flight Number</label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="flightNumber"
                      value={formData.flightNumber}
                      onChange={handleChange}
                      placeholder="e.g. SK123"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Airline */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Airline</label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="airline"
                      value={formData.airline}
                      onChange={handleChange}
                      placeholder="e.g. Sky Airlines"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">From (Source)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      placeholder="e.g. New York"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">To (Destination)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="e.g. London"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Departure Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      name="departureTime"
                      value={formData.departureTime}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Arrival Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 150"
                      min="0"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Total Seats */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      name="totalSeats"
                      value={formData.totalSeats}
                      onChange={handleChange}
                      placeholder="e.g. 180"
                      min="1"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Flight...' : 'Create Flight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFlight;
