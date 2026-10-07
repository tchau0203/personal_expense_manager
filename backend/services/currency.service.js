/* ================================================================
   currency.service.js — Dịch vụ đa tiền tệ (Phase 3)
   Dùng tỷ giá cứng + cache 24h, hoặc ExchangeRate-API nếu có key
   ================================================================ */

// Tỷ giá cứng dự phòng: giá trị 1 unit chuyển về VND
const FALLBACK_RATES = {
  VND: 1,
  USD: 26300,
  EUR: 30100,
  JPY: 175,
  CNY: 3700,
  SGD: 20900,
  KRW: 19.2,
  THB: 810,
};

const CURRENCY_SYMBOLS = {
  VND: '₫', USD: '$', EUR: '€', JPY: '¥',
  CNY: '¥', SGD: 'S$', KRW: '₩', THB: '฿',
};

const CURRENCY_NAMES = {
  VND: 'Việt Nam Đồng',
  USD: 'US Dollar',
  EUR: 'Euro',
  JPY: 'Nhật Yên',
  CNY: 'Nhân dân tệ',
  SGD: 'Đô la Singapore',
  KRW: 'Won Hàn Quốc',
  THB: 'Baht Thái',
};

// Cache
let ratesCache = null;
let cacheExpiry = null;

// Lấy tỷ giá (từ API nếu có key, fallback về hardcoded)
async function getRates() {
  const now = Date.now();
  if (ratesCache && cacheExpiry && now < cacheExpiry) {
    return ratesCache;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/base/VND`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.result === 'success') {
          ratesCache = data.conversion_rates;
          cacheExpiry = now + 24 * 60 * 60 * 1000; // Cache 24h
          console.log('[Currency] ✅ Tỷ giá được cập nhật từ ExchangeRate-API');
          return ratesCache;
        }
      }
    } catch (err) {
      console.warn('[Currency] ⚠️ Không lấy được tỷ giá từ API, dùng fallback:', err.message);
    }
  }

  // Dùng tỷ giá cứng
  ratesCache = FALLBACK_RATES;
  cacheExpiry = now + 24 * 60 * 60 * 1000;
  return ratesCache;
}

// Chuyển đổi tiền tệ
async function convert(amount, fromCurrency, toCurrency) {
  const from = String(fromCurrency || 'VND').toUpperCase();
  const to = String(toCurrency || 'VND').toUpperCase();
  if (from === to) return amount;
  const rates = await getRates();

  // Chuyển giá trị về VND theo tỷ giá hiện tại, rồi sang loại tiền đích
  const amountInVND = from === 'VND'
    ? amount
    : amount * (rates[from] || 1);

  const result = to === 'VND'
    ? amountInVND
    : amountInVND / (rates[to] || 1);

  return Math.round(result * 100) / 100;
}

// Format số tiền theo tiền tệ
function formatAmount(amount, currency = 'VND') {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  const decimals = currency === 'VND' ? 0 : 2;

  const formatted = Number(amount).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return currency === 'VND' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

// Danh sách tiền tệ hỗ trợ
function getSupportedCurrencies() {
  return Object.keys(FALLBACK_RATES).map(code => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    name: CURRENCY_NAMES[code],
  }));
}

module.exports = { getRates, convert, formatAmount, getSupportedCurrencies };
