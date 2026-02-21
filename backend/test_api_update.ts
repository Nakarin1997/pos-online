import http from 'http';

const updateData = JSON.stringify({
  name: "น้ำเปล่า test patch",
  sku: "CAT3E-002",
  price: 10,
  cost: 4,
  stock: 15,
  categoryId: "3e1844ec-3373-4add-8762-1356d22db339"
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3002,
  path: '/products/9eede696-b2a0-46bf-a0e9-97e79c3838bc',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(updateData)
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(updateData);
req.end();
