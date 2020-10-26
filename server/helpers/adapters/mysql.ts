import db from '../mysql';

export async function storeProposal(
  space,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  const msg = JSON.parse(body.msg);
  const query = 'INSERT IGNORE INTO messages SET ?;';
  await db.queryAsync(query, [
    {
      id: authorIpfsHash,
      address: body.address,
      version: msg.version,
      timestamp: msg.timestamp,
      space,
      token,
      type: 'proposal',
      payload: JSON.stringify(msg.payload),
      sig: body.sig,
      metadata: JSON.stringify({
        relayer_ipfs_hash: relayerIpfsHash
      })
    }
  ]);
}

export async function getProposals(token: string) {
  const query =
    "SELECT * FROM messages WHERE type = 'proposal' AND token = ? ORDER BY timestamp DESC";
  return db.queryAsync(query, [token]);
}

export async function getProposalVotes(token: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND token = ? AND JSON_EXTRACT(payload, "$.proposal") = ? ORDER BY timestamp ASC`;
  return db.queryAsync(query, [token, id]);
}

export async function storeVote(
  space,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  const msg = JSON.parse(body.msg);
  const query = 'INSERT IGNORE INTO messages SET ?;';
  await db.queryAsync(query, [
    {
      id: authorIpfsHash,
      address: body.address,
      version: msg.version,
      timestamp: msg.timestamp,
      space,
      token,
      type: 'vote',
      payload: JSON.stringify(msg.payload),
      sig: body.sig,
      metadata: JSON.stringify({
        relayer_ipfs_hash: relayerIpfsHash
      })
    }
  ]);
}
