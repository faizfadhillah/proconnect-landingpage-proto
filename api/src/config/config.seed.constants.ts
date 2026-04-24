interface ConfigSeedItem {
  code: string;
  name: string;
}

interface ConfigSeedData {
  key: string;
  description: string;
  values: ConfigSeedItem[];
}

export const CONFIG_SEED_DATA: ConfigSeedData[] = [
  {
    key: 'education_level',
    description: 'Diploma levels based on ASEAN MRA-TP standard',
    values: [
      { code: 'CERT_II', name: 'Certificate II' },
      { code: 'CERT_III', name: 'Certificate III' },
      { code: 'CERT_IV', name: 'Certificate IV' },
      { code: 'DIPLOMA', name: 'Diploma' },
      { code: 'ADV_DIPLOMA', name: 'Advanced Diploma' },
    ],
  },
  {
    key: 'certificate_level',
    description: 'Certificate levels for licenses',
    values: [
      { code: 'CERT_II', name: 'Certificate II' },
      { code: 'CERT_III', name: 'Certificate III' },
      { code: 'CERT_IV', name: 'Certificate IV' },
      { code: 'DIPLOMA', name: 'Diploma' },
      { code: 'ADV_DIPLOMA', name: 'Advanced Diploma' },
    ],
  },
];

