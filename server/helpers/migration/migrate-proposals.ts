// @ts-ignore
const redis = require('../redis.ts');
// @ts-ignore
const mysql = require('../mysql.ts');

let lastSpaceIndex = 0;

// @ts-ignore
async function getProposals(space) {
  try {
    let proposals = await redis.hgetallAsync(`token:${space}:proposals`) || {};
    // @ts-ignore
    return Object.values(proposals).map(proposal => JSON.parse(proposal));
  } catch (e) {
    console.error(e);
  }
}

function formatProposal(space, body, authorIpfsHash, relayerIpfsHash) {
  const msg = JSON.parse(body.msg);
  return {
    id: authorIpfsHash,
    address: body.address,
    version: msg.version,
    timestamp: msg.timestamp,
    token: space,
    type: 'proposal',
    payload: JSON.stringify(msg.payload),
    sig: body.sig,
    metadata: JSON.stringify({
      relayer_ipfs_hash: relayerIpfsHash
    })
  };
}

async function storeMessages(messages) {
  let query = 'INSERT IGNORE INTO messages (id, address, version, timestamp, token, type, payload, sig, metadata) VALUES ?;';
  try {
    return await mysql.queryAsync(query, [messages.map(message => Object.values(message))]);
  } catch (e) {
    console.error('Store messages failed', e);
  }
}

async function migrateProposals(space) {
  const proposals = await getProposals(space);
  // @ts-ignore
  console.log('Number of proposals', proposals.length);
  // @ts-ignore
  if (!proposals.length) return;
  // @ts-ignore
  return await storeMessages(proposals.map(proposal => {
    const body = JSON.parse(JSON.stringify(proposal));
    body.msg = JSON.stringify(body.msg);
    proposal = formatProposal(
      proposal.msg.token,
      body,
      proposal.authorIpfsHash,
      proposal.relayerIpfsHash
    );
    return proposal;
  }));
}

async function start(space) {
  if (space && space.address && space.name) {
    console.log('- Migrate proposals for', space.name, space.address);
    const result = await migrateProposals(space.address);
    console.log('Result', result);
    lastSpaceIndex++;
    setTimeout(() => start(), 10);
  }
}

module.exports = start