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

const chains = [1, 137, 8453, 42161, 10, 11155111];
const baseUrl = 'https://api.etherscan.io/v2/api';

for (const chainId of chains) {
  try {
    const r = await fetchJSON(`${baseUrl}?chainid=${chainId}&module=account&action=balance&address=${addr}&tag=latest&apikey=${key}`);
    console.log(`Chain ${chainId}: status=${r.status} message=${r.message} result=${typeof r.result === 'string' ? r.result.substring(0, 100) : r.result}`);
  } catch (e) {
    console.log(`Chain ${chainId}: ERROR ${e.message}`);
  }
}
