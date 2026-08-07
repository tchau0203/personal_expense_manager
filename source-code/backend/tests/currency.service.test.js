const { convert } = require('../services/currency.service');

describe('Currency service convert()', () => {
  it('should convert 1 USD to VND using the current exchange rate', async () => {
    const value = await convert(1, 'USD', 'VND');
    expect(value).toBe(26300);
  });

  it('should convert 1000 VND to USD using the current exchange rate', async () => {
    const value = await convert(1000, 'VND', 'USD');
    expect(value).toBeGreaterThan(0.03);
    expect(value).toBeLessThan(0.05);
  });

  it('should accept lower-case currency codes', async () => {
    const value = await convert(1, 'usd', 'vnd');
    expect(value).toBe(26300);
  });
});
