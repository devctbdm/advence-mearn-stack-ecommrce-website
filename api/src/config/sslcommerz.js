import SSLCommerzPayment from 'sslcommerz-lts';

let sslczInstance = null;

export const getSslcz = () => {
  if (!sslczInstance) {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';

    if (!storeId || !storePassword) {
      throw new Error(
        'SSLCommerz credentials are not configured properly. Please check SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in .env file'
      );
    }

    sslczInstance = new SSLCommerzPayment(storeId, storePassword, isLive);
  }
  return sslczInstance;
};

export default getSslcz;
