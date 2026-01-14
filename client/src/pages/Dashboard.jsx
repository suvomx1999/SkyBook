import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, MapPin, User, Armchair, CreditCard, Trash2, AlertCircle, Plane, Plus, Printer, Users, TrendingUp, Search, XCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin State
  const [adminStats, setAdminStats] = useState({ totalRevenue: 0, totalBookings: 0, totalFlights: 0, totalUsers: 0 });
  const [adminTab, setAdminTab] = useState('overview');
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminFlights, setAdminFlights] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

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

  const fetchAdminData = async () => {
    try {
      const [statsRes, bookingsRes, flightsRes, usersRes] = await Promise.all([
        API.get('/bookings/stats'),
        API.get('/bookings/all'),
        API.get('/flights'),
        API.get('/users')
      ]);
      setAdminStats(statsRes.data);
      setAdminBookings(bookingsRes.data);
      setAdminFlights(flightsRes.data);
      setAdminUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAdminData();
    } else {
      fetchBookings();
    }
  }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await API.put(`/bookings/${id}/cancel`);
      if (user?.isAdmin) {
        fetchAdminData();
      } else {
        fetchBookings();
      }
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  const handleDeleteFlight = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await API.delete(`/flights/${id}`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete flight.');
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
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500">Manage flights, bookings, and users</p>
            </div>
            <Link to="/add-flight" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Flight
            </Link>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-800">₹{adminStats.totalRevenue?.toLocaleString() || 0}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Bookings</p>
                        <h3 className="text-2xl font-bold text-slate-800">{adminStats.totalBookings || 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Active Flights</p>
                        <h3 className="text-2xl font-bold text-slate-800">{adminStats.totalFlights || 0}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Plane className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Users</p>
                        <h3 className="text-2xl font-bold text-slate-800">{adminStats.totalUsers || 0}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>
                </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            <div className="border-b border-slate-200 flex overflow-x-auto">
                {['overview', 'bookings', 'flights', 'users'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setAdminTab(tab)}
                        className={`px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap transition-colors ${
                            adminTab === tab 
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {/* Overview Tab */}
                {adminTab === 'overview' && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Bookings</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">ID</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Flight</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {adminBookings.slice(0, 5).map((booking) => (
                                        <tr key={booking._id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-mono text-xs">#{booking._id.slice(-6)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{booking.user?.name || booking.passengerName}</td>
                                            <td className="px-4 py-3">{booking.flight?.flightNumber || 'N/A'}</td>
                                            <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-medium">₹{booking.totalPrice}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    booking.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {adminBookings.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-400">No bookings found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Bookings Tab */}
                {adminTab === 'bookings' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Booking ID</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Flight</th>
                                    <th className="px-4 py-3">Route</th>
                                    <th className="px-4 py-3">Seats</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {adminBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs">#{booking._id.slice(-6)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{booking.user?.name || booking.passengerName}</div>
                                            <div className="text-xs text-slate-400">{booking.user?.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{booking.flight?.flightNumber || 'Deleted'}</td>
                                        <td className="px-4 py-3">
                                            {booking.flight ? `${booking.flight.source} → ${booking.flight.destination}` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">{booking.seats}</td>
                                        <td className="px-4 py-3 font-medium">₹{booking.totalPrice}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                booking.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {booking.status === 'booked' && (
                                                <button 
                                                    onClick={() => handleCancel(booking._id)}
                                                    className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                    title="Cancel Booking"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Flights Tab */}
                {adminTab === 'flights' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Flight No</th>
                                    <th className="px-4 py-3">Airline</th>
                                    <th className="px-4 py-3">Route</th>
                                    <th className="px-4 py-3">Departure</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Seats</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {adminFlights.map((flight) => (
                                    <tr key={flight._id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{flight.flightNumber}</td>
                                        <td className="px-4 py-3">{flight.airline}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{flight.source}</span>
                                                <span className="text-slate-400">→</span>
                                                <span className="font-medium">{flight.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{new Date(flight.departureTime).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">{new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">₹{flight.price}</td>
                                        <td className="px-4 py-3">{flight.availableSeats}/{flight.totalSeats}</td>
                                        <td className="px-4 py-3">
                                            <button 
                                                onClick={() => handleDeleteFlight(flight._id)}
                                                className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Delete Flight"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Users Tab */}
                {adminTab === 'users' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {adminUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                {u.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{u.email}</td>
                                        <td className="px-4 py-3">
                                            {u.isAdmin ? (
                                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Admin</span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">User</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
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
