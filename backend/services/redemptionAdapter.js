/**
 * Modular E-Code Redemption Adapter Interface
 * 
 * Allows swapping between Manual Admin Verification (default)
 * and future automated third-party provider APIs (e.g., Razer Merchant Services, Apple In-App/Store API, or CardCash/Prepaid Providers).
 */

class ECodeRedemptionService {
  constructor() {
    this.mode = process.env.REDEMPTION_MODE || 'MANUAL'; // 'MANUAL' or 'AUTOMATED_API'
  }

  /**
   * Validates code format according to card type
   */
  validateFormat(cardType, code) {
    if (!code || typeof code !== 'string') return false;
    const clean = code.trim().replace(/[-\s]/g, '');

    if (cardType === 'razer_gold') {
      // Razer Gold typically alphanumeric 14-20 chars
      return clean.length >= 10 && clean.length <= 30;
    } else if (cardType === 'apple') {
      // Apple Gift Card typically 16 alphanumeric characters starting with X or 16-digits
      return clean.length >= 12 && clean.length <= 25;
    }
    return clean.length >= 8;
  }

  /**
   * Attempts automatic redemption if a provider is configured.
   * If in MANUAL mode, returns { autoRedeemed: false, manualReviewRequired: true }.
   */
  async processRedemption(cardType, rawCode, claimedAmount) {
    if (this.mode === 'MANUAL') {
      return {
        autoRedeemed: false,
        manualReviewRequired: true,
        message: 'Deposit queued for manual administrative review.'
      };
    }

    // Extensible hook for external vendor API integration
    // e.g., const res = await vendorApi.redeem({ cardType, code: rawCode, amount: claimedAmount });
    return {
      autoRedeemed: false,
      manualReviewRequired: true,
      message: 'Third-party gateway offline; falling back to manual review.'
    };
  }
}

module.exports = new ECodeRedemptionService();
