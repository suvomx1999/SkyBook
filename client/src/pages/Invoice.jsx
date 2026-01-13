import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Printer, CheckCircle, Plane, Calendar, MapPin, User, Mail, Shield, Download } from 'lucide-react';

const Invoice = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const componentRef = useRef();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await API.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-slate-500">Generating Invoice...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:p-0">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>

      <div 
        id="invoice-content"
        ref={componentRef} 
        className="bg-white max-w-3xl mx-auto p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Plane className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight">SkyBook</span>
            </div>
            <p className="text-slate-500 text-sm">Your trusted travel partner</p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-widest mb-2">Invoice</h1>
            <p className="text-slate-500 text-sm">#{booking._id.slice(-8).toUpperCase()}</p>
            <div className="flex items-center justify-end gap-1 text-green-600 text-sm font-medium mt-1">
              <CheckCircle className="w-3 h-3" /> Paid
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
            <div className="text-slate-800 font-medium">{booking.user?.name}</div>
            <div className="text-slate-500 text-sm">{booking.user?.email}</div>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Booking Date</h3>
            <div className="text-slate-800 font-medium">
              {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </div>
            <div className="text-slate-500 text-sm">
              {new Date(booking.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Flight Details Card */}
        <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-500" /> Flight Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-slate-400 mb-1">Airline</div>
              <div className="font-semibold text-slate-800">{booking.flight?.airline}</div>
              <div className="text-xs text-slate-500">{booking.flight?.flightNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Route</div>
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                {booking.flight?.source} <span className="text-slate-400">&rarr;</span> {booking.flight?.destination}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Departure</div>
              <div className="font-semibold text-slate-800">
                {new Date(booking.flight?.departureTime).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Passenger Details
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Seat</th>
                <th className="py-3 px-4 text-left font-medium">Passenger Name</th>
                <th className="py-3 px-4 text-left font-medium">Type</th>
                <th className="py-3 px-4 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {booking.passengers && booking.passengers.length > 0 ? (
                booking.passengers.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium">{p.seat}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {['A', 'F'].includes(p.seat.slice(-1)) ? 'Window' : 
                       ['C', 'D'].includes(p.seat.slice(-1)) ? 'Aisle' : 'Middle'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{p.gender}, {p.age} yrs</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600 font-medium">{booking.seatNumbers.join(', ')}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{booking.passengerName}</td>
                  <td className="py-3 px-4 text-slate-500">-</td>
                  <td className="py-3 px-4 text-right text-slate-500">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col gap-2 max-w-xs ml-auto">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Seats ({booking.seats})</span>
              <span>₹{booking.flight?.price} x {booking.seats}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Seat Selection Fees</span>
              <span>₹{booking.totalPrice - (booking.flight?.price * booking.seats) - (booking.tax || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Tax (5%)</span>
              <span>₹{booking.tax || 0}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Taxes & Fees (Other)</span>
              <span>₹0</span>
            </div>
            <div className="border-t border-slate-100 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Paid</span>
              <span className="text-2xl font-bold text-blue-600">₹{booking.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs">
          <p className="mb-2">Thank you for choosing SkyBook for your journey.</p>
          <p>For support, email us at support@skybook.com</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;