import https from 'https';

const key = 'SN9CMUQK4TYUQEGGBPHF99R9B38UMK7R5T';
const addr = '0xa7a6bd20fb57c43223084ad8525e24743e52c8ec';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

const baseUrl = 'https://api.etherscan.io/v2/api';

const r1 = await fetchJSON(`${baseUrl}?chainid=1&module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`);
console.log('ETH tokentx:', r1.status, r1.message, Array.isArray(r1.result) ? r1.result.length + ' token txs' : r1.result);

const r2 = await fetchJSON(`${baseUrl}?chainid=8453&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${key}`);
console.log('Base txlist:', r2.status, r2.message, Array.isArray(r2.result) ? r2.result.length + ' txs' : r2.result);

const r3 = await fetchJSON(`${baseUrl}?chainid=8453&module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`);
console.log('Base tokentx:', r3.status, r3.message, Array.isArray(r3.result) ? r3.result.length + ' token txs' : r3.result);

const r4 = await fetchJSON(`${baseUrl}?chainid=8453&module=account&action=balance&address=${addr}&tag=latest&apikey=${key}`);
console.log('Base balance:', r4.status, r4.message, r4.result);
