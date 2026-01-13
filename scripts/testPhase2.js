const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  try {
    console.log('🚀 Starting Phase 2 Verification...\n');

    // 1. Login as Admin
    console.log('1️⃣  Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Admin logged in. Token received.\n');

    // 2. Create a Flight
    console.log('2️⃣  Creating a new flight...');
    const flightData = {
      flightNumber: `TEST${Math.floor(Math.random() * 1000)}`,
      airline: 'Test Airlines',
      source: 'New York',
      destination: 'London',
      departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      price: 550,
      totalSeats: 200,
    };

    const createRes = await fetch(`${BASE_URL}/flights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(flightData),
    });

    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(`Create flight failed: ${JSON.stringify(err)}`);
    }
    const createdFlight = await createRes.json();
    const flightId = createdFlight._id;
    console.log(`✅ Flight created: ${createdFlight.flightNumber} (ID: ${flightId})\n`);

    // 3. Search Flights (Public)
    console.log('3️⃣  Searching flights (Public)...');
    const searchRes = await fetch(`${BASE_URL}/flights?source=New York&destination=London`);
    const searchData = await searchRes.json();
    console.log(`✅ Found ${searchData.length} flight(s) matching criteria.\n`);

    // 4. Update Flight
    console.log('4️⃣  Updating flight price...');
    const updateRes = await fetch(`${BASE_URL}/flights/${flightId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ price: 999 }),
    });

    if (!updateRes.ok) throw new Error('Update failed');
    const updatedFlight = await updateRes.json();
    console.log(`✅ Price updated to: $${updatedFlight.price}\n`);

    // 5. Delete Flight
    console.log('5️⃣  Deleting flight...');
    const deleteRes = await fetch(`${BASE_URL}/flights/${flightId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteRes.ok) throw new Error('Delete failed');
    console.log('✅ Flight deleted successfully.\n');

    console.log('🎉 Phase 2 Verification Completed Successfully!');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
};

runTests();
