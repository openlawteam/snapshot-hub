import db from '../postgres';

async function insert(
  authorIpfsHash: string,
  body: any,
  msg: any,
  space: string,
  token: string,
  messageType: string,
  relayerIpfsHash: any
) {
  const query =
    'INSERT INTO messages (id, address, version, timestamp, space, token, type, payload, sig, metadata) VALUES ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT ON CONSTRAINT messages_pkey DO NOTHING';
  await db.query(query, [
    authorIpfsHash,
    body.address,
    msg.version,
    msg.timestamp,
    space,
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
  space,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  await insert(
    authorIpfsHash,
    body,
    JSON.parse(body.msg),
    space,
    token,
    'proposal',
    relayerIpfsHash
  );
}

export async function getProposals(space: string) {
  const query =
    "SELECT * FROM messages WHERE type = 'proposal' AND space = $1 ORDER BY timestamp DESC";
  const result = await db.query(query, [space]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalsBy(space: string, id: string) {
  const query = `SELECT * FROM messages WHERE space = $1 AND id = $2 AND type = 'proposal'`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalVotes(space: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND space = $1 AND payload ->> 'proposal' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
}

export async function storeVote(
  space,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  await insert(
    authorIpfsHash,
    body,
    JSON.parse(body.msg),
    space,
    token,
    'vote',
    relayerIpfsHash
  );
}
