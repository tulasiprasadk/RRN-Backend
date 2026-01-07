(async()=>{
  try{
    const payload = { orderId: 1, email: 'convert-test@example.com', name: 'Converted Guest' };
    const res = await fetch('http://localhost:3000/api/orders/convert-guest', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  }catch(e){ console.error('ERR', e); }
})();
