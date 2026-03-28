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

// V1 per-chain hosts
const hosts = {
  1: 'api.etherscan.io',
  137: 'api.polygonscan.com',
  42161: 'api.arbiscan.io',
  10: 'api-optimistic.etherscan.io',
  8453: 'api.basescan.org',
  11155111: 'api-sepolia.etherscan.io',
};

for (const [chainId, host] of Object.entries(hosts)) {
  try {
    const r = await fetchJSON(`https://${host}/api?module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=desc&page=1&offset=5&apikey=${key}`);
    console.log(`Chain ${chainId} (${host}): status=${r.status} message=${r.message} result=${Array.isArray(r.result) ? r.result.length + ' txs' : (typeof r.result === 'string' ? r.result.substring(0, 80) : r.result)}`);
  } catch (e) {
    console.log(`Chain ${chainId} (${host}): ERROR ${e.message}`);
  }
}
