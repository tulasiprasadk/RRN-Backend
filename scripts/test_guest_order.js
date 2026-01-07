(async ()=>{
  try {
    const payload = { productId: 226, qty: 1, customerName: 'Test Guest', customerPhone: '9999999999', customerAddress: '123 Test St, Test City' };
    const res = await fetch('http://localhost:3000/api/orders/create-guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (e) {
    console.error('TEST ERROR', e);
  }
})();
