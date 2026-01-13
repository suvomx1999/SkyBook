import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Not used with redirect: 'if_required' usually, but required parameter
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        setErrorMessage('Payment did not succeed. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded border border-red-100">{errorMessage}</div>}
      <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/2 py-3 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-1/2 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Pay ₹${amount}`}
          </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
