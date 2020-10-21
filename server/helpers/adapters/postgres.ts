import db from '../postgres';

async function insert(
  authorIpfsHash: string,
  body: any,
  msg: any,
  token: string,
  messageType: string,
  relayerIpfsHash: any
) {
  const query =
    'INSERT INTO messages (id, address, version, timestamp, token, type, payload, sig, metadata) VALUES ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ON CONSTRAINT messages_pkey DO NOTHING';
  await db.query(query, [
    authorIpfsHash,
    body.address,
    msg.version,
    msg.timestamp,
    token,
    messageType,
    JSON.stringify(msg.payload),
    body.sig,
    JSON.stringify({
      relayer_ipfs_hash: relayerIpfsHash
    })
  ]);
}

export async function storeProposal(
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  await insert(
    authorIpfsHash,
    body,
    JSON.parse(body.msg),
    token,
    'proposal',
    relayerIpfsHash
  );
}

export async function getProposals(token: string) {
  const query =
    "SELECT * FROM messages WHERE type = 'proposal' AND token = $1 ORDER BY timestamp DESC";
  const result = await db.query(query, [token]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalsBy(token: string, id: string) {
  const query = `SELECT * FROM messages WHERE token = $1 AND id = $2 AND type = 'proposal'`;
  const result = await db.query(query, [token, id]);
  console.log(result.rows.length);
  return result.row;
}

export async function getProposalVotes(token: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND token = $1 AND payload ->> 'proposal' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [token, id]);
  console.log(result.rows.length);
  return result.rows;
}

export async function storeVote(token, body, authorIpfsHash, relayerIpfsHash) {
  await insert(
    authorIpfsHash,
    body,
    JSON.parse(body.msg),
    token,
    'vote',
    relayerIpfsHash
  );
}
