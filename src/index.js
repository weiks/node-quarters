import axios from 'axios'

class Quarters {
  constructor(options = {}) {
    const msgMapping = {
      key: 'App key',
      secret: 'App secret',
      webSecret: 'App web secret',
      address: 'App address'
    }

    Object.keys(msgMapping).forEach(k => {
      if (!options[k]) {
        throw new Error(`${msgMapping[k]} is required.`)
      }
    })

    // options
    const quartersURL = options.quartersURL || 'https://pocketfulofquarters.com'
    this.options = {
      key: options.key,
      secret: options.secret,
      webSecret: options.webSecret,
      address: options.address,
      quartersURL: quartersURL,
      apiURL: options.apiURL || 'https://api.pocketfulofquarters.com/v1/'
    }

    // For convention around apps.
    this.txTypes = {
      BUY: 'buy',         // Purchase Quarters with $$
      WIN: 'win',         // Win Quarters in an app
      SPEND: 'spend',     // Spend Quarters in an app
      REFUND: 'refund',   // Refund Quarters to wallet
      RETURN: 'return',   // Return Quarters for $$
      BONUS: 'bonus',     // Earn Quarters as reward
      COUPON: 'coupon'    // Get Quarters from redeeming a coupon
    }
  }

  createRefreshToken(code) {
    const data = {
      client_id: this.options.key,
      client_secret: this.options.webSecret,
      grant_type: 'authorization_code',
      code: code
    }

    return axios
      .post(`${this.options.apiURL}oauth/token`, data)
      .then(response => {
        return response.data
      })
  }

  createAccessToken(refreshToken) {
    const data = {
      client_id: this.options.key,
      client_secret: this.options.webSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }

    return axios
      .post(`${this.options.apiURL}oauth/token`, data)
      .then(response => {
        return response.data
      })
  }

  // user details
  fetchUser(accessToken) {
    return axios
      .get(`${this.options.apiURL}me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(response => response.data)
  }

  // request transfer from quarter server
  transferQuarters(data) {
    if (!data.amount) {
      throw new Error('`amount` is required')
    }

    if (!data.user && !data.address) {
      throw new Error('`user` or `address` is required')
    }

    const payload = {
      address: data.address,
      user: data.user,
      amount: parseInt(data.amount),
      ...data
    }

    // transfer token to provided user/address
    const appAddress = this.options.address
    const url = `${this.options.apiURL}accounts/${appAddress}/transfer`
    const opt = {
      headers: {
        Authorization: `Bearer ${this.options.secret}`
      }
    }
    return axios.post(url, payload, opt).then(response => response.data)
  }

  // request transfer from user
  requestTransfer(data) {
    if (!data.tokens) {
      throw new Error('`tokens` is required')
    }

    const payload = {
      appId: this.options.key,
      userId: data.userId,
      tokens: parseInt(data.tokens),
      ...data
    }

    const url = `${this.options.apiURL}requests`
    return axios.post(url, payload).then(response => response.data)
  }

  // approve transfer from user
  approveTransfer(data) {
    if (!data.requestId) {
      throw new Error('`requestId` is required')
    }

    if (!data.userId) {
      throw new Error('`userId` is required')
    }

    const payload = {
      clientId: this.options.key,
      ...data
    }

    const url = `${this.options.apiURL}requests/${data.requestId}/autoApprove`
    const opt = {
      headers: {
        Authorization: `Bearer ${this.options.secret}`
      }
    }
    return axios.post(url, payload, opt).then(response => response.data)
  }
}

export default Quarters
