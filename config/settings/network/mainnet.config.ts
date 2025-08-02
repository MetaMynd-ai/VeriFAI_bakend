import { ISmartNode } from '@hsuite/types';

export const customMainnetConfig: {
  nodes: Array<ISmartNode.IOperator>,
  utilities: Array<ISmartNode.IUtility>
} = ({
  nodes: [
    {
      accountId: "0.0.6187183",
      publicKey: "55b04f8f458b27f18cee96e796bf798c6b6fbb2aaa82306e08c34990a72d21a7",
      url: "http://10.0.0.15:3001"
    },
    // {
    //   accountId: "0.0.6187209",
    //   publicKey: "c44b02edc10c4e3a6ccb527fb76f6d85aaa61d7d08218baf6ea4735f920dff1b",
    //   url: "http://10.0.0.15:3002"
    // },
    // {
    //   accountId: "0.0.6187221",
    //   publicKey: "9e2593cdca6347a50fb8f7692cc0aadf098e589952b797100ae81c16594509d2",
    //   url: "http://10.0.0.15:3003"
    // },
    // {
    //   accountId: "0.0.6187239",
    //   publicKey: "aec05ca45d987d20a1578b2a28fa201d68a1547f52adaac00213949f1cc1d878",
    //   url: "http://10.0.0.232:3004"
    // },
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
