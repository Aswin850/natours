/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51LsgeySDPgngRq2gWvj4iJUSJahP3maXhA1WjdcMV1mTUIjAEw9Jju056AQNF8GgEY089WKuaMWTiALsbF55NhnO00WxRCAbBM'
);

export const bookTour = async tourId => {
  // get checkout section from API
  try {
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // Create checkout from + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
