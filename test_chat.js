const http = require('http');

const cases = [
  'que tienen disponible',
  'tenes pantalones',
  'la remera mas barata',
  'el pantalon mas barato',
  'la remera mas cara',
  'vermudas',
  'que me recomendas para regalar',
  'no lo mas barato',
  'algunos baratos',
  'lo mas caro',
  'remeras',
  'camperas',
  'hola',
];

function post(message) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ message });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const c of cases) {
    try {
      const r = await post(c);
      const first = r.products && r.products[0] ? r.products[0].name + ' $' + r.products[0].price : '(none)';
      console.log(`[${c}] intent=${r.intent} n=${r.products ? r.products.length : 0} | "${r.text}" | ${first}`);
    } catch (e) {
      console.log(`[${c}] ERROR: ${e.message}`);
    }
  }
})();
