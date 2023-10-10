import { OffchainProofsRepository } from '../offchain-proofs-repository.js';
import { OffchainProof } from '../../helpers/adapters/postgres.js';
import { snapshotHubMongoDb } from '../../index.js';
const getOffchainProof: (
  space: string,
  merkleRoot: string
) => Promise<OffchainProof[]> = async (space, merkleRoot) => {
  const db = await snapshotHubMongoDb;
  const collection = db.collection(
    process.env
      .MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_OFFCHAIN_PROOFS_COLLECTION_NAME
  );
  return collection
    .find<OffchainProof>({
      space,
      merkleRoot
    })
    .limit(1)
    .then((proofs: OffchainProof[]) => console.log(proofs.length));
};

const saveOffchainProof: (
  offchainProof: OffchainProof
) => Promise<void> = async offchainProof => {
  const db = await snapshotHubMongoDb;
  const collection = db.collection(
    process.env
      .MONGODB_TRIBUTE_DAOS_SNAPSHOT_HUB_DB_OFFCHAIN_PROOFS_COLLECTION_NAME
  );
  return collection.insertOne(offchainProof);
};
export const mongoOffchainProofsRepository: OffchainProofsRepository = {
  getOffchainProof,
  saveOffchainProof
};
