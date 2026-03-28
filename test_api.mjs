import http from 'http';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

const addr = '0xa7a6bd20fb57c43223084ad8525e24743e52c8ec';
const base = 'http://localhost:3001';

// Test ETH balance+tokens
const r1 = await fetchJSON(`${base}/balance?address=${addr}&chainId=1`);
console.log('ETH balance:', r1.data?.native?.balanceEth, 'tokens:', r1.data?.tokens?.length);
if (r1.data?.tokens?.length > 0) {
  r1.data.tokens.forEach(t => console.log(`  ${t.symbol}: ${t.balance}`));
}

// Test ETH transactions
const r2 = await fetchJSON(`${base}/etherscan/transactions?address=${addr}&chainId=1`);
console.log('ETH transactions:', Array.isArray(r2.data) ? r2.data.length : 'error', r2.error);

// Test Base balance+tokens
const r3 = await fetchJSON(`${base}/balance?address=${addr}&chainId=8453`);
console.log('Base balance:', r3.data?.native?.balanceEth, 'tokens:', r3.data?.tokens?.length);

// Test Base transactions
const r4 = await fetchJSON(`${base}/etherscan/transactions?address=${addr}&chainId=8453`);
console.log('Base transactions:', Array.isArray(r4.data) ? r4.data.length : 'error', r4.error);
