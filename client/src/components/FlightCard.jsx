import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Plane, Clock, ArrowRight, User, Armchair, CheckCircle, AlertCircle, X, Trash2, Eye } from 'lucide-react';

const FlightCard = ({ flight, onDelete }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [seats, setSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [totalPrice, setTotalPrice] = useState(0);

  // Calculate duration (simple mock logic for demo)
  const duration = "4h 30m"; // In real app, calculate diff between arrival/departure

  useEffect(() => {
    if (showModal && !user?.isAdmin) {
      // Initialize with empty
      setOccupiedSeats([]);
      setSelectedSeats([]);
      setSeats(0);
      setTotalPrice(0);

      // Fetch actual booked seats from backend
      API.get(`/bookings/flight/${flight._id}/occupied`)
        .then(res => {
          setOccupiedSeats(prev => [...new Set([...prev, ...res.data])]);
        })
        .catch(err => console.error('Failed to fetch occupied seats', err));
    }
  }, [showModal, flight, user]);

  // Real-time seat updates
  useEffect(() => {
    let socket;
    if (showModal && !user?.isAdmin) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001');
      socket.emit('join_flight', flight._id);

      // Fetch initial locks
      API.get(`/flights/${flight._id}/locks`)
        .then((res) => {
          setOccupiedSeats((prev) => [...prev, ...res.data]);
          setSelectedSeats((prev) => prev.filter((s) => !res.data.includes(s)));
        })
        .catch((err) => console.error('Failed to fetch locks', err));

      socket.on('seatsLocked', ({ seats }) => {
        setOccupiedSeats((prev) => [...prev, ...seats]);
        setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      });

      socket.on('seatsBooked', ({ seats }) => {
        setOccupiedSeats((prev) => [...prev, ...seats]);
        setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [showModal, flight._id, user?.isAdmin]);

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;
    
    let newSelection;
    if (selectedSeats.includes(seatId)) {
      newSelection = selectedSeats.filter(id => id !== seatId);
    } else {
      if (selectedSeats.length >= flight.availableSeats) {
        alert(`You can only select up to ${flight.availableSeats} seats.`);
        return;
      }
      newSelection = [...selectedSeats, seatId];
    }
    
    setSelectedSeats(newSelection);
    setSeats(newSelection.length);

    // Calculate Price
    const price = newSelection.reduce((acc, seat) => {
       const col = seat.slice(-1);
       let seatPrice = flight.price;
       if (['A', 'F', 'C', 'D'].includes(col)) {
          seatPrice += 150;
       }
       return acc + seatPrice;
    }, 0);
    setTotalPrice(price);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await API.delete(`/flights/${flight._id}`);
      if (onDelete) onDelete(flight._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete flight');
    }
  };

  const handleBookClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.isAdmin) {
      handleDetailsClick();
    } else {
      setShowModal(true);
    }
  };

  const handleDetailsClick = async () => {
    setShowModal(true);
    if (user.isAdmin) {
      setLoadingBookings(true);
      try {
        const res = await API.get(`/bookings/flight/${flight._id}`);
        setBookings(res.data);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoadingBookings(false);
      }
    }
  };

  const handleProceed = (e) => {
    e.preventDefault();
    if (seats === 0) return;
    
    navigate(`/book/${flight._id}`, {
      state: {
        flight,
        seatNumbers: selectedSeats,
        totalPrice
      }
    });
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden group">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            {/* Airline Info */}
            <div className="flex items-center space-x-4 w-full md:w-1/4">
              <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{flight.airline}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{flight.flightNumber}</p>
              </div>
            </div>

            {/* Flight Route & Time */}
            <div className="flex-1 w-full md:w-1/2">
              <div className="flex items-center justify-between px-4 md:px-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase mt-1">{flight.source}</div>
                </div>

                <div className="flex flex-col items-center px-4 w-full">
                  <div className="text-xs text-slate-400 mb-1">{duration}</div>
                  <div className="relative w-full flex items-center">
                    <div className="h-[1px] bg-slate-300 w-full"></div>
                    <Plane className="h-4 w-4 text-blue-400 absolute left-1/2 -translate-x-1/2 rotate-90" />
                  </div>
                  <div className="text-xs text-green-600 font-medium mt-1">Non-stop</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase mt-1">{flight.destination}</div>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="w-full md:w-1/4 flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
              <div className="text-left md:text-right">
                <div className="text-3xl font-bold text-slate-900">₹{flight.price}</div>
                <div className="text-xs text-slate-500 mb-2 flex items-center md:justify-end gap-1">
                  <Armchair className="h-3 w-3" />
                  {flight.availableSeats} seats left
                </div>
              </div>
              <button 
                onClick={handleBookClick}
                disabled={flight.availableSeats === 0 && !user?.isAdmin}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow ${
                  flight.availableSeats === 0 && !user?.isAdmin
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {user?.isAdmin ? (
                  <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> View Details</span>
                ) : (
                  flight.availableSeats === 0 ? 'Sold Out' : 'Select'
                )}
              </button>
              {user && user.isAdmin && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow bg-red-100 text-red-600 hover:bg-red-200 ml-2"
                  title="Delete Flight"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-md w-full relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-blue-600 p-6 text-white">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold">{user?.isAdmin ? 'Flight Details' : 'Confirm Booking'}</h2>
              <div className="flex items-center gap-2 mt-2 text-blue-100 text-sm">
                <span>{flight.source}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{flight.destination}</span>
              </div>
            </div>

            <div className="p-6">
              {user?.isAdmin ? (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Airline</p>
                        <p className="font-medium text-slate-900">{flight.airline}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Flight No.</p>
                        <p className="font-medium text-slate-900">{flight.flightNumber}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Price</p>
                        <p className="font-medium text-slate-900">₹{flight.price}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Seats</p>
                        <p className="font-medium text-slate-900">{flight.availableSeats} / {flight.totalSeats}</p>
                      </div>
                   </div>

                   <div>
                     <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                       <User className="h-5 w-5 text-blue-600" /> Passenger List
                     </h3>
                     {loadingBookings ? (
                       <div className="text-center py-4 text-slate-500">Loading bookings...</div>
                     ) : bookings.length > 0 ? (
                       <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                         <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                             <tr>
                               <th className="px-4 py-2">Name</th>
                               <th className="px-4 py-2">Seats</th>
                               <th className="px-4 py-2">User</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             {bookings.map((booking) => (
                               <tr key={booking._id} className="hover:bg-slate-50">
                                 <td className="px-4 py-2 font-medium text-slate-900">{booking.passengerName}</td>
                                 <td className="px-4 py-2 text-slate-600">{booking.seats}</td>
                                 <td className="px-4 py-2 text-slate-500 text-xs">{booking.user?.name || 'N/A'}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     ) : (
                       <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                         No bookings yet for this flight.
                       </div>
                     )}
                   </div>
                </div>
              ) : (
              <>
              {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.includes('Success') ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span className="text-sm font-medium">{message}</span>
                </div>
              )}

              {!message.includes('Success') && (
                <form onSubmit={handleProceed} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Seats</label>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center max-h-[300px] overflow-y-auto">
                      <div className="w-full max-w-[200px] h-1 bg-slate-300 mb-4 rounded-full relative">
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 uppercase tracking-widest">Front</span>
                      </div>

                      <div className="grid gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(row => (
                          <div key={row} className="flex gap-4">
                            <div className="flex gap-1">
                              {['A', 'B', 'C'].map(col => {
                                const seatId = `${row}${col}`;
                                const isOccupied = occupiedSeats.includes(seatId);
                                const isSelected = selectedSeats.includes(seatId);
                                return (
                                  <button
                                    key={seatId}
                                    type="button"
                                    onClick={() => toggleSeat(seatId)}
                                    disabled={isOccupied}
                                    className={`w-8 h-8 rounded text-[10px] font-bold transition-all flex items-center justify-center
                                      ${isOccupied 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                        : isSelected 
                                          ? 'bg-blue-600 text-white shadow-md scale-105' 
                                          : 'bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-500'
                                      }
                                    `}
                                  >
                                    {seatId}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="w-4 flex items-center justify-center text-xs text-slate-300 font-mono">{row}</div>

                            <div className="flex gap-1">
                              {['D', 'E', 'F'].map(col => {
                                const seatId = `${row}${col}`;
                                const isOccupied = occupiedSeats.includes(seatId);
                                const isSelected = selectedSeats.includes(seatId);
                                return (
                                  <button
                                    key={seatId}
                                    type="button"
                                    onClick={() => toggleSeat(seatId)}
                                    disabled={isOccupied}
                                    className={`w-8 h-8 rounded text-[10px] font-bold transition-all flex items-center justify-center
                                      ${isOccupied 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                        : isSelected 
                                          ? 'bg-blue-600 text-white shadow-md scale-105' 
                                          : 'bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-500'
                                      }
                                    `}
                                  >
                                    {seatId}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3 mt-4 text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Available</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div> Selected</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded"></div> Occupied</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100 mt-6">
                    <div className="flex flex-col">
                       <span className="text-slate-600 font-medium">Total Price</span>
                       <span className="text-xs text-slate-400">Includes seat selection fees</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">₹{totalPrice > 0 ? totalPrice : 0}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || seats === 0}
                    className={`w-full py-3 rounded-lg font-bold transition shadow-lg shadow-blue-600/20 active:scale-[0.98] ${
                      bookingLoading || seats === 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {seats > 0 ? `Proceed to Passenger Details (${seats} Seat${seats > 1 ? 's' : ''})` : 'Select Seats to Book'}
                  </button>
                </form>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlightCard;
