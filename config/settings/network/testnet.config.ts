import { ISmartNode } from '@hsuite/types';

export const customTestnetConfig: {
  nodes: Array<ISmartNode.IOperator>,
  utilities: Array<ISmartNode.IUtility>
} = ({
  nodes: [
   {
      accountId: "0.0.5970444",
      publicKey: "302a300506032b65700321005fc6171cfb576f1c24d0fe3536ee049057a1ec6e42d3de570b8f223a2685da47",
      url: "http://192.168.10.174:3001"
    }
    // {
    //   accountId: "0.0.4422809",
    //   publicKey: "302d300706052b8104000a032200022fc21db893c71cfa36bdf4022c3974ecec63f6b19dd5fcf2c1bc865433841672",
    //   url: "http://10.0.0.232:3005"
    // },
    // {
    //   accountId: "0.0.4422811",
    //   publicKey: "302d300706052b8104000a03220002fdc933862db69e8847a1e2adeed0f1d1b149681c90837f42d137eba2e5b91134",
    //   url:  "http://10.0.0.232:3006"
    // }
  ],
  utilities: [
    // you can config your utilities here...
    {
      name: 'hsuite',
      id: '0.0.2203022',
      treasury: '0.0.2193470',
      decimals: '4'
    },
    {
      name: 'veHsuite',
      id: '0.0.2203405',
      treasury: '0.0.2203617',
      decimals: '4'
    },
    {
      name: 'lpHSuite',
      id: '0.0.2666544',
      treasury: '0.0.2193470'
    },
    {
      name: 'nftDexHSuite',
      id: '0.0.2666543',
      treasury: '0.0.2193470'
    },
    {
      name: 'shibar',
      id: '0.0.2203306',
      treasury: '0.0.2193470',
      decimals: '4'
    }
  ]
});
