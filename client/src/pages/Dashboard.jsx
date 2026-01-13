import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, MapPin, User, Armchair, CreditCard, Trash2, AlertCircle, Plane, Plus, Printer } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings/my');
      setBookings(res.data);
    } catch (err) {
      setError('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await API.put(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (user?.isAdmin) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6 md:p-12">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
          <p className="text-slate-500 mb-8">Manage flights and view system status</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/" className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plane className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Flights</h3>
              <p className="text-slate-500">View, search, and delete existing flights. View passenger lists.</p>
            </Link>

            <Link to="/add-flight" className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Add New Flight</h3>
              <p className="text-slate-500">Schedule a new flight and set pricing and capacity.</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6 md:p-12">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Dashboard</h1>
        <p className="text-slate-500 mb-8">Manage your flight bookings and view history</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">No bookings yet</h3>
            <p className="text-slate-500 mt-2">You haven't booked any flights. Time to explore!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div 
                key={booking._id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* Status & ID */}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                        booking.status === 'booked' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${booking.status === 'booked' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {booking.status}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">#{booking._id.slice(-6)}</span>
                    </div>

                    {/* Flight Details */}
                    <div className="flex-1 w-full md:w-auto">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <span className="font-bold text-lg text-slate-800">{booking.flight?.source}</span>
                        </div>
                        <div className="hidden md:block w-12 h-[1px] bg-slate-300"></div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <span className="font-bold text-lg text-slate-800">{booking.flight?.destination}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {booking.flight ? new Date(booking.flight.departureTime).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {booking.flight ? new Date(booking.flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-slate-400" />
                          {booking.passengerName}
                        </div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="flex items-center gap-2 text-slate-800">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <span className="text-xl font-bold">₹{booking.totalPrice}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <Armchair className="h-3 w-3" />
                        {booking.seats} Seat(s)
                      </div>
                      
                      {booking.status === 'booked' && (
                        <div className="flex gap-2">
                          <Link 
                            to={`/invoice/${booking._id}`}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          >
                            <Printer className="h-4 w-4" />
                            Invoice
                          </Link>
                          <button 
                            onClick={() => handleCancel(booking._id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition px-3 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
