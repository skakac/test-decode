// import { PublicKey } from '@solana/web3.js';
// import { BinaryReader, BinaryWriter } from 'borsh';

const { PublicKey } = require('@solana/web3.js');
const { BinaryReader, BinaryWriter } = require('borsh');

// THIS CODE IS TAKEN FROM metaplex/js/packages/common/src/utils/borsh.ts
const extendBorsh = () => {
  (BinaryReader.prototype).readPubkey = function () {
    // const reader = this as unknown as BinaryReader;
    // eslint-disable-next-line consistent-this
    const reader = this;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };

  (BinaryWriter.prototype).writePubkey = function (value) {
    // const writer = this as unknown as BinaryWriter;
    // eslint-disable-next-line consistent-this
    const writer = this;
    writer.writeFixedArray(value.toBuffer());
  };
};

extendBorsh();

module.exports = { extendBorsh }
