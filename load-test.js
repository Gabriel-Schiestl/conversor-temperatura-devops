// ============================================================
// load-test.js — gerador de carga para demonstração de HPA
// Altere TARGET_IP para o IP externo do seu LoadBalancer
// ============================================================

const http = require('http');

const TARGET_IP   = '0.0.0.0';   // <-- substitua pelo IP do LoadBalancer
const TARGET_PORT = 32000;
const CONCURRENCY = 50;           // requisições paralelas por rodada
const INTERVAL_MS = 100;          // intervalo entre rodadas (ms)

const ENDPOINTS = [
  '/celsius/100/fahrenheit',
  '/celsius/0/fahrenheit',
  '/celsius/37/fahrenheit',
  '/fahrenheit/212/celsius',
  '/fahrenheit/32/celsius',
  '/fahrenheit/98/celsius',
];

let totalRequests  = 0;
let totalErrors    = 0;
let startTime      = Date.now();

function makeRequest() {
  const path = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  return new Promise((resolve) => {
    const req = http.get(
      { hostname: TARGET_IP, port: TARGET_PORT, path, timeout: 5000 },
      (res) => {
        res.resume();
        res.on('end', () => resolve({ ok: true, status: res.statusCode }));
      }
    );
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
  });
}

async function runRound() {
  const promises = Array.from({ length: CONCURRENCY }, makeRequest);
  const results  = await Promise.all(promises);

  const errors = results.filter((r) => !r.ok).length;
  totalRequests += CONCURRENCY;
  totalErrors   += errors;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rps     = (totalRequests / parseFloat(elapsed)).toFixed(1);

  process.stdout.write(
    `\r[${elapsed}s] total: ${totalRequests} req | erros: ${totalErrors} | ~${rps} req/s   `
  );
}

console.log(`Alvo: http://${TARGET_IP}:${TARGET_PORT}`);
console.log(`Concorrência: ${CONCURRENCY} req/rodada | intervalo: ${INTERVAL_MS}ms`);
console.log('Pressione Ctrl+C para parar.\n');

setInterval(runRound, INTERVAL_MS);
