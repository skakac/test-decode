const { PublicKey, clusterApiUrl, Connection } = require('@solana/web3.js')
const { METADATA_PREFIX, decodeMetadata, decodeMasterEdition } = require('./nftMetadata')

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

    console.log('buffer bs64', dataBuffer.toString('base64'))
    console.log("buffer", atob(dataBuffer.toString('base64')))

    console.log('test', decodeMasterEdition(dataBuffer))

    const metadata = decodeMetadata(dataBuffer);
    console.log("decoded", metadata)

}

test(new PublicKey('8mt7y2ccZiwfgxDdoQFS5ajr2gFgvbjqQbx7ZWKHHE4p'));