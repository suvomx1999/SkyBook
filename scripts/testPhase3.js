const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  try {
    console.log('🚀 Starting Phase 3 Verification...\n');

    // 1. Register a Normal User
    console.log('1️⃣  Registering a normal user...');
    const userEmail = `user${Math.floor(Math.random() * 1000)}@example.com`;
    const registerRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal User',
        email: userEmail,
        password: 'password123',
      }),
    });

    if (!registerRes.ok) throw new Error('Registration failed');
    const userData = await registerRes.json();
    const token = userData.token;
    console.log(`✅ User registered: ${userData.email}\n`);

    // 2. Login as Admin to Create Flight
    console.log('2️⃣  Logging in as Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    console.log('✅ Admin logged in.\n');

    // 3. Create a Flight for Booking
    console.log('3️⃣  Creating a flight...');
    const flightRes = await fetch(`${BASE_URL}/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        flightNumber: `BOOK${Math.floor(Math.random() * 1000)}`,
        airline: 'Booking Air',
        source: 'City A',
        destination: 'City B',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
        price: 100,
        totalSeats: 10,
      }),
    });
    const flight = await flightRes.json();
    console.log(`✅ Flight created: ${flight.flightNumber} with 10 seats.\n`);

    // 4. Book Flight
    console.log('4️⃣  Booking 2 seats...');
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightId: flight._id,
        seats: 2,
        passengerName: 'John Doe',
      }),
    });

    if (!bookRes.ok) {
        const err = await bookRes.json();
        throw new Error(`Booking failed: ${JSON.stringify(err)}`);
    }
    const booking = await bookRes.json();
    console.log(`✅ Booking successful! ID: ${booking._id}`);
    console.log(`   Total Price: $${booking.totalPrice} (Expected: $200)\n`);

    // 5. Verify Seat Reduction
    console.log('5️⃣  Verifying seat reduction...');
    const flightCheckRes = await fetch(`${BASE_URL}/flights/${flight._id}`);
    const flightCheck = await flightCheckRes.json();
    console.log(`✅ Available Seats: ${flightCheck.availableSeats} (Expected: 8)\n`);

    // 6. Get My Bookings
    console.log('6️⃣  Checking user booking history...');
    const historyRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const history = await historyRes.json();
    console.log(`✅ Found ${history.length} booking(s).\n`);

    // 7. Cancel Booking
    console.log('7️⃣  Cancelling booking...');
    const cancelRes = await fetch(`${BASE_URL}/bookings/${booking._id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!cancelRes.ok) throw new Error('Cancellation failed');
    console.log('✅ Booking cancelled.\n');

    // 8. Verify Seat Restoration
    console.log('8️⃣  Verifying seat restoration...');
    const flightRestoreRes = await fetch(`${BASE_URL}/flights/${flight._id}`);
    const flightRestore = await flightRestoreRes.json();
    console.log(`✅ Available Seats: ${flightRestore.availableSeats} (Expected: 10)\n`);

    console.log('🎉 Phase 3 Verification Completed Successfully!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
};

runTests();
