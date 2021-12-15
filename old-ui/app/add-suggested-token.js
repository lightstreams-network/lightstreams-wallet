import * as Toast from './components/toast'
import TokenTracker from '@metamask/eth-token-tracker'
import log from 'loglevel'

const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const Tooltip = require('./components/tooltip.js')
const ethUtil = require('ethereumjs-util')
const Copyable = require('./components/copy/copyable')
const { addressSummary, toChecksumAddress, isValidAddress, accountSummary, countSignificantDecimals } = require('./util')
const MiniAccountPanel = require('./components/mini-account-panel')

module.exports = connect(mapStateToProps)(AddSuggestedTokenScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    suggestedTokens: state.metamask.suggestedTokens,
  }
}

inherits(AddSuggestedTokenScreen, Component)
function AddSuggestedTokenScreen () {
    this.state = {
      warning: null,
      isLoading: false,
      tokenBalance: 0,
  }
  Component.call(this)
}

function forwardCarrat () {
  return (
    h('img', {
      src: 'images/forward-carrat-light.svg',
      style: {
        padding: '0px 20px 0px',
        height: '62px',
      },
    })
  )
}

AddSuggestedTokenScreen.prototype.render = function () {
  const { warning, tokenBalance } = this.state
  const { network, suggestedTokens, dispatch } = this.props
  const key = Object.keys(suggestedTokens)[0]
  const { address, symbol, decimals } = suggestedTokens[key]

  const props = this.props
  const identity = props.identities[address] || { address: address }

  return (
    h('div', {
      style: {
        width: '100%',
      },
    }, [
      // tx info
      h('div',
        {
          },
        [

        h('.flex-row.flex-center', {
          style: {
            width: '100%',
            maxWidth: '100%',
            padding: '20px 20px 20px 20px',
            background: 'linear-gradient(#176de2, #7aabff)',
            position: 'relative',
          },
        }, [
          h(MiniAccountPanel, {
              image: symbol,
            },
          ),
          forwardCarrat(),
          h(MiniAccountPanel, {
            imageSeed: address,
            picOrder: 'left',
          },
          ),
        ]),

        h('style', `
            .table-box {
              margin: 7px 0px 0px 0px;
              width: 100%;
              position: relative;
            }
            .table-box .row {
              margin: 0px;
              background: #ffffff;
              display: flex;
              justify-content: space-between;
              font-family: Montserrat UltraLight;
              font-size: 14px;
              padding: 5px 30px;
            }
            .table-box .row .value {
              font-family: Montserrat UltraLight;
            }
          `),

        h('.table-box', [

          h('.flex-row.flex-center', {
            style: {
              marginTop: '20px',
              marginBottom: '30px',
            },
          }, [
            'Add Token', /*
            h(NetworkIndicator, {
              network: network,
              provider: provider,
              isUnlocked: isUnlocked,
            }),*/
          ]),

          h('.cell.row', [
            h('.cell.label', 'Symbol'),
            h('div', {
            }, symbol),
          ]),

          h('.cell.row', [
            h('.cell.label', 'Token Contract'),
            h(Copyable, {
              value: toChecksumAddress(props.network, address),
            }, [
              h('span', {},
                addressSummary(props.network, address, 8, 8, false)),
            ]),
          ]),

          h('.cell.row', [
            h('.cell.label', 'Balance'),
            h('div', {
            }, tokenBalance),
          ]),


        ]), // End of Table
          h('.flex-row.flex-space-around.conf-buttons', {
              style: {
                display: 'flex',
                justifyContent: 'flex-end',
                margin: '14px 30px',
              },
            },
            [
            h('button.cancel.btn-red', {
              style: {
                alignSelf: 'center',
                margin: '8px',
              },
              onClick: (event) => {
                dispatch(actions.removeSuggestedTokens())
              },
            }, 'Cancel'),

            h('button', {
                style: {
                  alignSelf: 'center',
                  margin: '8px',
                },
                onClick: (event) => {
                  const valid = this.validateInputs({ address, symbol, decimals })
                  if (!valid) return

                  dispatch(actions.addToken(address.trim(), symbol.trim(), decimals))
                    .then(() => {
                      dispatch(actions.removeSuggestedTokens())
                    })
                },
              },
              'Add'),
          ]),
      ]),
    ])
  )
}

AddSuggestedTokenScreen.prototype.UNSAFE_componentWillMount = function () {
  if (typeof global.ethereumProvider === 'undefined') return
}

AddSuggestedTokenScreen.prototype.validateInputs = function (opts) {
  const { network, identities } = this.props
  let msg = ''
  const identitiesList = Object.keys(identities)
  const { address, symbol, decimals } = opts
  const standardAddress = ethUtil.addHexPrefix(address).toLowerCase()

  const validAddress = isValidAddress(address, network)
  if (!validAddress) {
    msg += 'Address is invalid.'
  }

  const validDecimals = decimals >= 0 && decimals <= 36
  if (!validDecimals) {
    msg += 'Decimals must be at least 0, and not over 36. '
  }

  const symbolLen = symbol.trim().length
  const validSymbol = symbolLen > 0 && symbolLen < 10
  if (!validSymbol) {
    msg += 'Symbol must be between 0 and 10 characters.'
  }

  const ownAddress = identitiesList.includes(standardAddress)
  if (ownAddress) {
    msg = 'Personal address detected. Input the token contract address.'
  }

  const isValid = validAddress && validDecimals && !ownAddress

  if (!isValid) {
    this.setState({
      warning: msg,
    })
  } else {
    this.setState({ warning: null })
  }

  return isValid
}

AddSuggestedTokenScreen.prototype.componentDidMount = function () {
  this.createFreshTokenTracker()
}

AddSuggestedTokenScreen.prototype.createFreshTokenTracker = async function () {
  if (this.tracker) {
    // Clean up old trackers when refreshing:
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  if (!global.ethereumProvider) return

  const { suggestedTokens } = this.props
  const key = Object.keys(suggestedTokens)[0]
  const { address, symbol, decimals } = suggestedTokens[key]

  let userAddress = await actions.getSelectectAddress()

  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: [
      {
        address,
        symbol,
        decimals,
        network: null,
      },
    ],
    pollingInterval: 5000,
  })


  // Set up listener instances for cleaning up
  this.balanceUpdater = this.updateBalances.bind(this)
  this.showError = (error) => {
    this.setState({ error, isLoading: false })
  }
  this.tracker.on('update', this.balanceUpdater)
  this.tracker.on('error', this.showError)

  this.tracker.updateBalances()
    .then(() => {
      this.updateBalances(this.tracker.serialize())
    })
    .catch((reason) => {
      log.error(`Problem updating balances`, reason)
      this.setState({ isLoading: false })
    })
}

AddSuggestedTokenScreen.prototype.updateBalances = function (tokens) {
  if (!this.tracker.running) {
    return
  }
  let token = tokens[0]
  const tokenBalanceRaw = Number.parseFloat(token.string)
  const tokenBalance = tokenBalanceRaw.toFixed(countSignificantDecimals(tokenBalanceRaw, 2))
  this.setState({ tokenBalance, tokens, isLoading: false })
}

AddSuggestedTokenScreen.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
  this.tracker.removeListener('update', this.balanceUpdater)
  this.tracker.removeListener('error', this.showError)
}
