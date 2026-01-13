import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Plane, Calendar, Clock, CreditCard, User, Armchair, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BookingDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { flightId } = useParams();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Initialize passengers state based on selected seats
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    if (!state || !state.seatNumbers || state.seatNumbers.length === 0) {
      navigate('/');
      return;
    }

    // Initialize passenger forms
    const initialPassengers = state.seatNumbers.map(seat => ({
      seat,
      name: '',
      age: '',
      gender: 'Male'
    }));
    setPassengers(initialPassengers);
  }, [state, navigate]);

  if (!state) return null;

  const { flight, seatNumbers, totalPrice: preTaxTotal } = state;

  // Calculate Price Breakdown
  const basePrice = flight.price * seatNumbers.length;
  const seatFees = preTaxTotal - basePrice;
  const tax = basePrice * 0.05;
  const finalTotal = preTaxTotal + tax;

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const initiatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    for (const p of passengers) {
      if (!p.name || !p.age) {
        setError(`Please fill in all details for seat ${p.seat}`);
        setLoading(false);
        return;
      }
    }

    try {
      // Pass flight details to check/lock seats in Redis
      const res = await API.post('/payments/create-payment-intent', {
        amount: finalTotal,
        flightId: flight._id,
        seatNumbers: seatNumbers,
        userId: user?._id // Pass user ID to associate lock
      });
      setClientSecret(res.data.clientSecret);
      setShowPaymentModal(true);
    } catch (err) {
      console.error(err);
      // Show specific error if seat is locked
      setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setLoading(true);
    try {
      const res = await API.post('/bookings', {
        flightId: flight._id,
        seats: seatNumbers.length,
        seatNumbers: seatNumbers,
        passengers: passengers,
        totalPrice: finalTotal, // Send the tax-inclusive total
        paymentIntentId: paymentIntent.id
      });
      // Redirect to invoice page
      navigate(`/invoice/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed after payment. Please contact support.');
    } finally {
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl relative">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Complete Your Booking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - Passenger Details */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={initiatePayment}>
            {passengers.map((passenger, index) => (
              <div key={passenger.seat} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-4">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-blue-500" />
                    Passenger for Seat {passenger.seat}
                  </h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {['A', 'F'].includes(passenger.seat.slice(-1)) ? 'Window' : 
                     ['C', 'D'].includes(passenger.seat.slice(-1)) ? 'Aisle' : 'Middle'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? 'Processing...' : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay & Book Tickets
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column - Flight Summary */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Booking Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Flight</span>
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-500" />
                  {flight.airline} <span className="text-slate-400 text-sm">({flight.flightNumber})</span>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">From</span>
                  <div className="font-medium text-slate-700">{flight.source}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">To</span>
                  <div className="font-medium text-slate-700">{flight.destination}</div>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Date</span>
                  <div className="font-medium text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(flight.departureTime).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Time</span>
                  <div className="font-medium text-slate-700 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Seats ({seatNumbers.length})</span>
                <span>{seatNumbers.join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Base Fare</span>
                <span>₹{basePrice}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Seat Selection Fees</span>
                <span>₹{seatFees}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                <span className="font-bold text-slate-800">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">₹{finalTotal}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Payment</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter your card details to complete the booking.</p>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex justify-between items-center">
              <span className="font-medium text-slate-700">Total to Pay</span>
              <span className="text-xl font-bold text-blue-600">₹{finalTotal}</span>
            </div>

            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                amount={finalTotal} 
                onSuccess={handlePaymentSuccess} 
                onCancel={() => setShowPaymentModal(false)}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;