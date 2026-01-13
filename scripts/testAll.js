const BASE_URL = 'http://localhost:5001/api';

const runAllTests = async () => {
  try {
    console.log('🚀 Starting Comprehensive System Check (Phases 1, 2, 3)...\n');

    // --- Phase 1: Authentication ---
    console.log('🔹 PHASE 1: Authentication');
    
    // 1. Register Admin
    const adminEmail = `admin${Math.floor(Math.random() * 10000)}@test.com`;
    console.log('   Registering Admin...');
    const registerAdminRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin', email: adminEmail, password: 'password123' }),
    });
    if (!registerAdminRes.ok) throw new Error('Admin registration failed');
    const adminData = await registerAdminRes.json();
    
    // Manually set admin to true (simulated since we can't do it via API normally)
    // In a real test, we'd use the seeded admin, but for this flow we'll use the seeded admin script
    console.log('   (Using seeded admin for subsequent steps)');
    
    // Login as Seeded Admin
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
    });
    if (!loginRes.ok) throw new Error('Admin login failed');
    const adminAuth = await loginRes.json();
    const adminToken = adminAuth.token;
    console.log('   ✅ Admin Login: Success');

    // Register User
    const userEmail = `user${Math.floor(Math.random() * 10000)}@test.com`;
    console.log('   Registering User...');
    const registerUserRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User', email: userEmail, password: 'password123' }),
    });
    if (!registerUserRes.ok) throw new Error('User registration failed');
    const userData = await registerUserRes.json();
    const userToken = userData.token;
    console.log('   ✅ User Registration: Success\n');


    // --- Phase 2: Flight Management ---
    console.log('🔹 PHASE 2: Flight Management');

    // Create Flight
    console.log('   Creating Flight...');
    const flightData = {
      flightNumber: `FULL${Math.floor(Math.random() * 1000)}`,
      airline: 'Test Air',
      source: 'Paris',
      destination: 'Berlin',
      departureTime: new Date(Date.now() + 86400000).toISOString(),
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      price: 200,
      totalSeats: 50,
    };
    const createFlightRes = await fetch(`${BASE_URL}/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(flightData),
    });
    if (!createFlightRes.ok) throw new Error('Create flight failed');
    const flight = await createFlightRes.json();
    console.log(`   ✅ Flight Created: ${flight.flightNumber}`);

    // Search Flight
    console.log('   Searching Flight...');
    const searchRes = await fetch(`${BASE_URL}/flights?source=Paris&destination=Berlin`);
    const searchData = await searchRes.json();
    if (searchData.length === 0) throw new Error('Flight search failed');
    console.log(`   ✅ Flight Search: Found ${searchData.length} flight(s)\n`);


    // --- Phase 3: Booking System ---
    console.log('🔹 PHASE 3: Booking System');

    // Book Flight
    console.log('   Booking Flight...');
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        flightId: flight._id,
        seats: 2,
        passengerName: 'Test Passenger',
      }),
    });
    if (!bookRes.ok) throw new Error('Booking failed');
    const booking = await bookRes.json();
    console.log('   ✅ Booking: Success');

    // Verify Inventory
    const flightCheckRes = await fetch(`${BASE_URL}/flights/${flight._id}`);
    const flightCheck = await flightCheckRes.json();
    if (flightCheck.availableSeats !== 48) throw new Error('Seat reduction failed');
    console.log('   ✅ Seat Inventory Reduced: Verified (50 -> 48)');

    // Check History
    const historyRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    const history = await historyRes.json();
    if (history.length === 0) throw new Error('Booking history failed');
    console.log('   ✅ Booking History: Verified');

    // Cancel Booking
    console.log('   Cancelling Booking...');
    const cancelRes = await fetch(`${BASE_URL}/bookings/${booking._id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    if (!cancelRes.ok) throw new Error('Cancellation failed');
    console.log('   ✅ Cancellation: Success');

    // Verify Restoration
    const flightRestoreRes = await fetch(`${BASE_URL}/flights/${flight._id}`);
    const flightRestore = await flightRestoreRes.json();
    if (flightRestore.availableSeats !== 50) throw new Error('Seat restoration failed');
    console.log('   ✅ Seat Inventory Restored: Verified (48 -> 50)\n');

    console.log('🎉 ALL SYSTEMS OPERATIONAL!');
  } catch (error) {
    console.error('❌ SYSTEM CHECK FAILED:', error.message);
    if (error.cause) console.error(error.cause);
  }
};

runAllTests();
