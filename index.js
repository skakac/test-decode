const { PublicKey, clusterApiUrl, Connection } = require('@solana/web3.js')
const { decodeMetadata, decodeMasterEdition } = require('./nftMetadata')

const METADATA_PREFIX = 'metadata';
const metadataProgramId = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
)

async function getMetadataPublicKey(nftPublicKey) {
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from(METADATA_PREFIX),
                metadataProgramId.toBuffer(),
                nftPublicKey.toBuffer(),
            ],
            metadataProgramId
        )
    )[0]
}

async function test (nftPublicKey) {
    const metadataPublicKey = await getMetadataPublicKey(nftPublicKey)

    const connection = new Connection(clusterApiUrl('mainnet-beta'));

    const response = await connection.getAccountInfo(metadataPublicKey);
    console.log('response', response);

    const dataBuffer = response.data;

    console.log('test', decodeMasterEdition(dataBuffer))

    const metadata = decodeMetadata(dataBuffer);
    console.log("decoded", metadata)

}

test(new PublicKey('8mt7y2ccZiwfgxDdoQFS5ajr2gFgvbjqQbx7ZWKHHE4p'));
