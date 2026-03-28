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
const base = 'http://localhost:3005';

// Test ETH balance+tokens
const r1 = await fetchJSON(`${base}/balance?address=${addr}&chainId=1`);
console.log('ETH native:', r1.data?.native?.balanceEth, 'tokens:', r1.data?.tokens?.length);
if (r1.data?.tokens?.length > 0) {
  r1.data.tokens.slice(0, 5).forEach(t => console.log(`  ${t.symbol}: ${t.balance}`));
}

// Test ETH transactions
const r2 = await fetchJSON(`${base}/etherscan/transactions?address=${addr}&chainId=1`);
console.log('ETH txs:', Array.isArray(r2.data) ? r2.data.length : 'error');
if (Array.isArray(r2.data) && r2.data.length > 0) {
  console.log('  First tx:', r2.data[0].hash?.substring(0, 20));
}
