import { ISmartNode } from '@hsuite/types';

export const customLocalConfig: {
  nodes: Array<ISmartNode.IOperator>,
  utilities: Array<ISmartNode.IUtility>
} = ({
  nodes: [
    {
      accountId: "0.0.2197445",
      publicKey: "302a300506032b6570032100dd5660e4f85c15898fc96f531b0041f2da3817f4b3a975dbde98510dc7a6943b",
      url: "http://localhost:3001"
    }
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
