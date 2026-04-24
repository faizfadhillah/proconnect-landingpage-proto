import { normalizePhoneAndCountryCode } from './phone.util';

describe('normalizePhoneAndCountryCode', () => {
  it('normalizes Indonesian number with countryCode and leading 0', () => {
    const result = normalizePhoneAndCountryCode('085217308231', '62');

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('handles +62 with extra leading 0 after country code (e.g. +62 081...)', () => {
    const result = normalizePhoneAndCountryCode('+62 0812345678', '62');

    expect(result).toEqual({
      countryCode: '62',
      phone: '812345678',
    });
  });

  it('normalizes when digits already contain 62 followed by 0 (e.g. 6208...)', () => {
    const result = normalizePhoneAndCountryCode('62085217308231', '62');

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('infers countryCode for Indonesian number with leading 0 when countryCode is empty', () => {
    const result = normalizePhoneAndCountryCode('085217308231', null);

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('infers countryCode for Indonesian number without leading 0 and without explicit countryCode', () => {
    const result = normalizePhoneAndCountryCode('85217308231', undefined);

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('extracts countryCode from phone when included as +62 prefix', () => {
    const result = normalizePhoneAndCountryCode('+6285217308231', null);

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('extracts countryCode from phone when included as 62 prefix', () => {
    const result = normalizePhoneAndCountryCode('6285217308231', '');

    expect(result).toEqual({
      countryCode: '62',
      phone: '85217308231',
    });
  });

  it('returns null for invalid/too-short phone numbers', () => {
    expect(normalizePhoneAndCountryCode('08123', '62')).toBeNull();
    expect(normalizePhoneAndCountryCode('', '62')).toBeNull();
    expect(normalizePhoneAndCountryCode(null, '62')).toBeNull();
    expect(normalizePhoneAndCountryCode(undefined, '62')).toBeNull();
  });
});

