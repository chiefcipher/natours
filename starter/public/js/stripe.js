/* eslint-disable */
// this script processes payment
// Stripe is the object we get by including stripe in tour.pug
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51LuJ2vFIDmjnz4MHnihmT0doQARDGsUhc2FcDmYJw37uq3uv4eMxPAQwXfjMRJxTakKAbxH8ZQm1DbzGdKVcUOZS00UVTqYUZc'
);
export const bookTour = async (tourId) => {
  try {
    // 1. get checkout session from api
    // axios like this automatically does get request
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // 2. create checout form + charge credit card
    console.log(session);
    await stripe.redirectToCheckout({
      sessionId : session.data.session.id
    })
  } catch (err) {
    showAlert('error', err);
  }
};
