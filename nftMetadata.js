const {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} = require('@solana/web3.js');
// import { programIds } from '../utils/ids';
const { deserializeUnchecked, serialize } = require('borsh');

// import BN from 'bn.js';
// import { findProgramAddress } from '../utils';

const METADATA_PREFIX = 'metadata';
const EDITION = 'edition';
const RESERVATION = 'reservation';

const MAX_NAME_LENGTH = 32;

const MAX_SYMBOL_LENGTH = 10;

const MAX_URI_LENGTH = 200;

const MAX_CREATOR_LIMIT = 5;

const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_METADATA_LEN =
    1 +
    32 +
    32 +
    MAX_NAME_LENGTH +
    MAX_SYMBOL_LENGTH +
    MAX_URI_LENGTH +
    MAX_CREATOR_LIMIT * MAX_CREATOR_LEN +
    2 +
    1 +
    1 +
    198;

const MAX_EDITION_LEN = 1 + 32 + 8 + 200;

const EDITION_MARKER_BIT_SIZE = 248;

const MetadataKey = {
    Uninitialized: 0,
    MetadataV1: 4,
    EditionV1: 1,
    MasterEditionV1: 2,
    MasterEditionV2: 6,
    EditionMarker: 7
}

const MetadataCategory = {
    Audio: 'audio',
    Video: 'video',
    Image: 'image',
    VR: 'vr',
}

class MasterEditionV1 {

    constructor(args) {
        this.key = MetadataKey.MasterEditionV1;
        this.supply = args.supply;
        this.maxSupply = args.maxSupply;
        this.printingMint = args.printingMint;
        this.oneTimePrintingAuthorizationMint =
            args.oneTimePrintingAuthorizationMint;
    }
}

class MasterEditionV2 {

    constructor(args) {
        this.key = MetadataKey.MasterEditionV2;
        this.supply = args.supply;
        this.maxSupply = args.maxSupply;
    }
}

class EditionMarker {

    constructor(args) {
        this.key = MetadataKey.EditionMarker;
        this.ledger = args.ledger;
    }

    editionTaken(edition) {
        const editionOffset = edition % EDITION_MARKER_BIT_SIZE;
        const indexOffset = Math.floor(editionOffset / 8);

        if (indexOffset > 30) {
            throw Error('bad index for edition');
        }

        const positionInBitsetFromRight = 7 - (editionOffset % 8);

        const mask = Math.pow(2, positionInBitsetFromRight);

        const appliedMask = this.ledger[indexOffset] & mask;

        return appliedMask != 0;
    }
}

class Edition {

    constructor(args) {
        this.key = MetadataKey.EditionV1;
        this.parent = args.parent;
        this.edition = args.edition;
    }
}
class Creator {
    constructor(args) {
        this.address = args.address;
        this.verified = args.verified;
        this.share = args.share;
    }
}

class Data {
    constructor(args) {
        this.name = args.name;
        this.symbol = args.symbol;
        this.uri = args.uri;
        this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
        this.creators = args.creators;
    }
}

class Metadata {
    constructor(args) {
        this.key = MetadataKey.MetadataV1;
        this.updateAuthority = args.updateAuthority;
        this.mint = args.mint;
        this.data = args.data;
        this.primarySaleHappened = args.primarySaleHappened;
        this.isMutable = args.isMutable;
    }

    // public async init() {
    //   const edition = await getEdition(this.mint);
    //   this.edition = edition;
    //   this.masterEdition = edition;
    // }
}

class CreateMetadataArgs {
    instruction = 1;

    constructor(args) {
        this.data = args.data;
        this.isMutable = args.isMutable;
    }
}
class UpdateMetadataArgs {
    instruction = 1;

    constructor(args) {
        this.data = args.data ? args.data : null;
        this.updateAuthority = args.updateAuthority
            ? new PublicKey(args.updateAuthority)
            : null;
        this.primarySaleHappened = args.primarySaleHappened;
    }
}

class CreateMasterEditionArgs {
    instruction = 10;

    constructor(args) {
        this.maxSupply = args.maxSupply;
    }
}

class MintPrintingTokensArgs {
    instruction = 9;

    constructor(args) {
        this.supply = args.supply;
    }
}

const METADATA_SCHEMA = new Map([
    [
        CreateMetadataArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['data', Data],
                ['isMutable', 'u8'], // bool
            ],
        },
    ],
    [
        UpdateMetadataArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['data', { kind: 'option', type: Data }],
                ['updateAuthority', { kind: 'option', type: 'pubkey' }],
                ['primarySaleHappened', { kind: 'option', type: 'u8' }],
            ],
        },
    ],

    [
        CreateMasterEditionArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
            ],
        },
    ],
    [
        MintPrintingTokensArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['supply', 'u64'],
            ],
        },
    ],
    [
        MasterEditionV1,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['supply', 'u64'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
                ['printingMint', 'pubkey'],
                ['oneTimePrintingAuthorizationMint', 'pubkey'],
            ],
        },
    ],
    [
        MasterEditionV2,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['supply', 'u64'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
            ],
        },
    ],
    [
        Edition,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['parent', 'pubkey'],
                ['edition', 'u64'],
            ],
        },
    ],
    [
        Data,
        {
            kind: 'struct',
            fields: [
                ['name', 'string'],
                ['symbol', 'string'],
                ['uri', 'string'],
                ['sellerFeeBasisPoints', 'u16'],
                ['creators', { kind: 'option', type: [Creator] }],
            ],
        },
    ],
    [
        Creator,
        {
            kind: 'struct',
            fields: [
                ['address', 'pubkey'],
                ['verified', 'u8'],
                ['share', 'u8'],
            ],
        },
    ],
    [
        Metadata,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['updateAuthority', 'pubkey'],
                ['mint', 'pubkey'],
                ['data', Data],
                ['primarySaleHappened', 'u8'], // bool
                ['isMutable', 'u8'], // bool
            ],
        },
    ],
    [
        EditionMarker,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['ledger', [31]],
            ],
        },
    ],
]);

const decodeMetadata = (buffer) => {
    const metadata = deserializeUnchecked(
        METADATA_SCHEMA,
        Metadata,
        buffer,
    );
    return metadata;
};

const decodeEditionMarker = (buffer) => {
    const editionMarker = deserializeUnchecked(
        METADATA_SCHEMA,
        EditionMarker,
        buffer,
    );
    return editionMarker;
};

const decodeEdition = (buffer) => {
    return deserializeUnchecked(METADATA_SCHEMA, Edition, buffer);
};

const decodeMasterEdition = (buffer) => {
    if (buffer[0] == MetadataKey.MasterEditionV1) {
        return deserializeUnchecked(
            METADATA_SCHEMA,
            MasterEditionV1,
            buffer,
        );
    } else {
        return deserializeUnchecked(
            METADATA_SCHEMA,
            MasterEditionV2,
            buffer,
        );
    }
};


async function updateMetadata(data, newUpdateAuthority, primarySaleHappened, updateAuthority, metadataAccount) {
    const metadataProgramId = new PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    );

    const value = new UpdateMetadataArgs({
        data,
        updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
        primarySaleHappened:
            primarySaleHappened === null || primarySaleHappened === undefined
                ? null
                : primarySaleHappened,
    });

    const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));

    const keys = [
        {
            pubkey: metadataAccount,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: updateAuthority,
            isSigner: true,
            isWritable: false,
        },
    ];

    const instruction = new TransactionInstruction({
        keys,
        programId: metadataProgramId,
        data: txnData,
    });

    return { instruction };
}

module.exports = {
    decodeMetadata, decodeMasterEdition, decodeEdition, decodeEditionMarker, METADATA_PREFIX
}
