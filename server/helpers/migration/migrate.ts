import { storeProposals, storeVotes } from '../adapters/postgres';
import { pinJson } from '../ipfs';
import relayer from '../relayer';
import axios from 'axios';

//TODO: load token map according to each env: dev/prod
const tokens = {
  thelao: '0x8276d5e4133eba2043a2a9fccc55284c1243f1d4'
};

// DEV TARGET_SNAPSHOT_HUB_API: https://testnet.snapshot.page
// DEV TOKEN: 0x8276d5e4133eba2043a2a9fccc55284c1243f1d4

// THE LAO PROD TARGET_SNAPSHOT_HUB_API: https://hub.snapshot.page
// THE LAO PROD TOKEN: 0x8f56682a50becb1df2fb8136954f2062871bc7fc

// FLAMINGO PROD TARGET_SNAPSHOT_HUB_API: https://hub.snapshot.page
// FLAMINGO PROD TOKEN: 0x43310bd1c8f261ee7b9025662207ed95329aa193

const TARGET_SNAPSHOT_HUB_API = process.env.TARGET_SNAPSHOT_HUB_API;

async function getProposals(space: string) {
  const url = `${TARGET_SNAPSHOT_HUB_API}/api/${space}/proposals`;
  //console.log(`@getProposals:: GET ${url}`);
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

async function getVotes(space: string, id: string) {
  const url = `${TARGET_SNAPSHOT_HUB_API}/api/${space}/proposal/${id}`;
  //console.log(`@getVotes:: GET ${url}`);
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

const sleep = (ms: number = Math.floor(Math.random() * 100) + 1) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function pinData(body, id) {
  const data = JSON.parse(JSON.stringify(body)); //copy
  console.log(`Pin: ${data.msg.type}:${id}`);

  const authorIpfsRes = await sleep().then(_ =>
    pinJson(`snapshot/${data.sig}`, {
      address: data.address,
      msg: data.msg,
      sig: data.sig,
      version: '2'
    })
  );

  const relayerSig = await relayer.signMessage(authorIpfsRes);
  const relayerIpfsRes = await sleep().then(_ =>
    pinJson(`snapshot/${relayerSig}`, {
      address: relayer.address,
      msg: authorIpfsRes,
      sig: relayerSig,
      version: '2'
    })
  );

  // save the old hashes before updating with the new ones
  data['deprecated'] = {
    deprecatedAuthorIpfsHash: data.authorIpfsHash,
    deprecatedRelayerIpfsHash: data.relayerIpfsHash
  };

  data['authorIpfsHash'] = authorIpfsRes;
  data['relayerIpfsHash'] = relayerIpfsRes;

  if (data.msg.type === 'proposal') data['newId'] = authorIpfsRes;
  if (data.msg.type === 'vote') data.msg.payload['proposal'] = id;

  console.log(`Pinned ${id}:${data.msg.type}:${authorIpfsRes}`);
  return data;
}

export async function migrateProposals(space: string) {
  if (!space || !tokens[space]) throw Error(`invalid space ${space}`);

  console.log(`Start migration for space ${space}`);

  const getAllProposals = () => {
    console.log(`Getting all proposals...`);
    return getProposals(space);
  };

  const pinProposal = async p => {
    console.log(`Pinning proposal ${p.id}...`);
    return await pinData(p, p.id).then(pinned => sleep().then(_ => pinned));
  };

  const saveProposal = p => {
    console.log(`Saving pinned proposal ${p.id} ...`);
    return storeProposals(space, [p]).then(_ => p);
  };

  const getAllVotes = async p => {
    console.log(`Getting all votes from proposal ${p.id}`);
    return await getVotes(space, p.id).then(votes => {
      return { p, votes };
    });
  };

  const pinVotes = async res => {
    const { p, votes } = res;
    console.log(
      `Pinning ${votes.length} votes from proposal ${p.newId}:${p.id}`
    );
    const pins = [];
    for (let i = 0; i < votes.length; i++) {
      await sleep(15000);
      const v = await pinData(votes[i], p.newId);
      pins.push(v);
    }
    return pins;
  };

  const saveVotes = votes => {
    console.log(`Saving ${votes.length} votes...`);
    return storeVotes(space, votes);
  };

  await getAllProposals().then(proposals =>
    Promise.all(
      proposals.map(p =>
        pinProposal(p)
          .then(pinnedProposal => saveProposal(pinnedProposal))
          .then(savedProposal => getAllVotes(savedProposal))
          .then(allVotes => pinVotes(allVotes))
          .then(pinnedVotes => saveVotes(pinnedVotes))
      )
    ).then(ids => console.log('Migration completed', ids.length))
  );
}
