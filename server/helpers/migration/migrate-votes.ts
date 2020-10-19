// @ts-ignore
const redis = require('./redis.ts');
// @ts-ignore
const mysql = require('./mysql.ts');

let proposals = [];
let lastProposalIndex = 0;

async function getProposals() {
  const query = 'SELECT id, token FROM messages WHERE type = ?';
  return await mysql.queryAsync(query, ['proposal']);
}

async function getVotes(space, proposal) {
  let votes = await redis.hgetallAsync(`token:${space}:proposal:${proposal}:votes`) || {};
  if (votes)
    votes = Object.fromEntries(Object.entries(votes).map(vote => {
      // @ts-ignore
      vote[1] = JSON.parse(vote[1]);
      return vote;
    }));
  return votes;
}

async function storeVotes(votes) {
  console.log(votes[0].id);
  let query = 'INSERT IGNORE INTO messages (id, address, version, timestamp, token, type, payload, sig, metadata) VALUES ?;';
  try {
    return await mysql.queryAsync(query, [votes.map(message => Object.values(message))]);
  } catch (e) {
    console.error('Store messages failed', e);
  }
}

function formatVote(space, body, authorIpfsHash, relayerIpfsHash) {
  const msg = JSON.parse(body.msg);
  return {
    id: authorIpfsHash,
    address: body.address,
    version: msg.version,
    timestamp: msg.timestamp,
    token: space,
    type: 'vote',
    payload: JSON.stringify(msg.payload),
    sig: body.sig,
    metadata: JSON.stringify({
      relayer_ipfs_hash: relayerIpfsHash
    })
  };
}

async function migrateNextProposalVotes() {
  const proposal = proposals[lastProposalIndex];
  if (proposal) {
    console.log('Migrate votes for', lastProposalIndex, JSON.stringify(proposal));
    // @ts-ignore
    const votesObj = await getVotes(proposal.token, proposal.id);
    const votes = Object.values(votesObj);
    if (votes.length > 0) {
      const response = await storeVotes(votes.map(vote => {
        const body = JSON.parse(JSON.stringify(vote));
        body.msg = JSON.stringify(body.msg);
        // @ts-ignore
        vote = formatVote(vote.msg.token, body, vote.authorIpfsHash, vote.relayerIpfsHash);
        return vote;
      }));
      console.log(response);
    } else {
      console.log('No votes');
    }
    lastProposalIndex++
    await migrateNextProposalVotes()
  } else {
    console.log('Finished migration');
  }
}

async function start() {
  proposals = await getProposals();
  await migrateNextProposalVotes();
}

start();
