import { storeProposals, storeVotes } from '../adapters/postgres';
import axios from 'axios';

// DEV TARGET_SNAPSHOT_HUB_API: https://testnet.snapshot.page
// DEV TOKEN: 0x8276d5e4133eba2043a2a9fccc55284c1243f1d4

// THE LAO PROD TARGET_SNAPSHOT_HUB_API: https://hub.snapshot.page
// THE LAO PROD TOKEN: 0x8f56682a50becb1df2fb8136954f2062871bc7fc

// FLAMINGO PROD TARGET_SNAPSHOT_HUB_API: https://hub.snapshot.page
// FLAMINGO PROD TOKEN: 0x43310bd1c8f261ee7b9025662207ed95329aa193

const TARGET_SNAPSHOT_HUB_API = process.env.TARGET_SNAPSHOT_HUB_API;

async function getProposals(token: string) {
  const url = `${TARGET_SNAPSHOT_HUB_API}/api/${token}/proposals`;
  console.log(`@getProposals:: GET ${url}`);
  return await axios
    .get(url)
    .then(resp => {
      const data = resp.data;
      const proposals = [];
      Object.keys(data).forEach(k => {
        const p = data[k];
        p['id'] = k;
        //console.log(`Proposal: ${JSON.stringify(p)}`);
        proposals.push(p);
      });

      return proposals;
    })
    .catch(e => {
      console.error(e);
      return [];
    });
}

async function getVotes(token: string, id: string) {
  const url = `${TARGET_SNAPSHOT_HUB_API}/api/${token}/proposal/${id}`;
  console.log(`@getVotes:: GET ${url}`);
  return await axios
    .get(url)
    .then(resp => {
      const data = resp.data;
      const votes = [];
      Object.keys(data).forEach(k => {
        const v = data[k];
        //console.log(`Vote: ${JSON.stringify(v)}`);
        votes.push(v);
      });

      return votes;
    })
    .catch(e => {
      console.error(e);
      return [];
    });
}

export async function migrateProposals(token: string) {
  if (!token) throw Error(`Proposals not found for token ${token}`);

  console.log(`Start migration for token ${token}`);

  const proposals = await getProposals(token);
  if (proposals.length == 0)
    throw Error(`0 proposals found for token ${token}`);

  console.log(`Saving ${proposals.length} proposals...`);
  await storeProposals(proposals);

  await Promise.all(
    proposals.map(p =>
      getVotes(token, p.id).then(votes => {
        console.log(`Saving ${votes.length} votes from proposal ${p.id}`);
        storeVotes(votes);
      })
    )
  ).then(_ => console.log('Migration completed'));

  //TODO call the pining service to pin votes and proposals
}
