export interface JutcHub {
  id: string;
  name: string;
  shortName: string;
  type: 'terminal' | 'depot' | 'exchange';
  latitude: number;
  longitude: number;
  routes: string[]; // Route codes that serve this hub
}

export const JUTC_HUBS: JutcHub[] = [
  {
    id: 'hwt',
    name: 'Half Way Tree Transport Centre',
    shortName: 'HWT',
    type: 'terminal',
    latitude: 17.9953,
    longitude: -76.7970,
    routes: ['22', '21', '23', '45', '73', '28', '30', '32', '75'],
  },
  {
    id: 'downtown',
    name: 'Downtown Transport Centre',
    shortName: 'DTC',
    type: 'terminal',
    latitude: 17.9977,
    longitude: -76.7943,
    routes: ['22', '45', '21', '23', '35', '36', '10', '24', '20', '1', '11', '55', '77'],
  },
  {
    id: 'papine',
    name: 'Papine Transport Centre',
    shortName: 'PAP',
    type: 'terminal',
    latitude: 17.9848,
    longitude: -76.7380,
    routes: ['45', '55', '75'],
  },
  {
    id: 'ferry',
    name: 'Ferry Transport Hub',
    shortName: 'FRY',
    type: 'exchange',
    latitude: 17.9699,
    longitude: -76.8592,
    routes: ['1', '73', '75', '77'],
  },
  {
    id: 'spanish-town',
    name: 'Spanish Town Bus Terminal',
    shortName: 'SPT',
    type: 'terminal',
    latitude: 17.9910,
    longitude: -76.9551,
    routes: ['36', '60'],
  },
  {
    id: 'portmore',
    name: 'Portmore Mall Transport Stop',
    shortName: 'PTM',
    type: 'exchange',
    latitude: 17.9538,
    longitude: -76.8870,
    routes: ['1', '35', '38', '60'],
  },
  {
    id: 'cross-roads',
    name: 'Cross Roads Exchange',
    shortName: 'CRS',
    type: 'exchange',
    latitude: 17.9905,
    longitude: -76.7982,
    routes: ['22', '45', '21', '23', '42'],
  },
];
