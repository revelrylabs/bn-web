/* eslint-disable */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import CheckoutForm from "../../common/cart/CheckoutFormWrapper";
import user from "../../../stores/user";

@observer
export default class MobileStripeAuth extends Component {
  componentWillMount() {
    const {match: {params: {access_token, refresh_token}}} = this.props

    // Set the access and refresh tokens based on the URL parameters
    localStorage.setItem("access_token", decodeURIComponent(access_token))
    localStorage.setItem("refresh_token", decodeURIComponent(refresh_token))

    // Refresh/authorize the user
    user.refreshToken(() => this.refreshUser(), (error) => {
      // return an error if the user could not be authorized
      window.postMessage(JSON.stringify({error: "User could not be authenticated"}))
    });
  }

  onToken = (stripeToken, onError) => {
    const {id, type} = stripeToken
    const data = stripeToken[type]

    // If we receive a credit card Token, pass credit card info back to the WebView
    if (type === "card") {
      console.log({
        id: id,
        type: type,
        last4: data.last4,
        brand: data.brand,
        card_id: data.id,
        exp_month: data.exp_month,
        exp_year:data.exp_year,
        name: data.name
      });

      window.postMessage(JSON.stringify({
        id: id,
        type: type,
        last4: data.last4,
        brand: data.brand,
        card_id: data.id,
        exp_month: data.exp_month,
        exp_year:data.exp_year,
        name: data.name,
      }))
    }
  }

  onMobileError = (message, _type) => {
    // If we receive a Stripe error, return it
    window.postMessage(JSON.stringify({error: message}))
  }

  render() {
    return <CheckoutForm onToken={this.onToken} onMobileError={this.onMobileError} />
  }
}