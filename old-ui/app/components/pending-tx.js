const Component = require('react').Component
const h = require('react-hyperscript')
const actions = require('../../../ui/app/actions')
import PropTypes from 'prop-types'
import clone from 'clone'
import log from 'loglevel'

import ethUtil from 'ethereumjs-util'
const BN = ethUtil.BN
const hexToBn = require('../../../app/scripts/lib/hex-to-bn')
const util = require('../util')
const MiniAccountPanel = require('./mini-account-panel')
const Copyable = require('./copy/copyable')
const EthBalance = require('./eth-balance')
const TokenBalance = require('./token-balance')
const { addressSummary, accountSummary, toChecksumAddress } = util
const nameForAddress = require('../../lib/contract-namer')
const BNInput = require('./bn-as-decimal-input')
const { getEnvironmentType } = require('../../../app/scripts/lib/util')
const NetworkIndicator = require('../components/network')
const { ENVIRONMENT_TYPE_NOTIFICATION } = require('../../../app/scripts/lib/enums')
import { connect } from 'react-redux'
import abiDecoder from 'abi-decoder'
const { tokenInfoGetter, calcTokenAmount } = require('../../../ui/app/token-util')
import BigNumber from 'bignumber.js'
import ethNetProps from 'eth-net-props'
import { getMetaMaskAccounts } from '../../../ui/app/selectors'
import { MIN_GAS_LIMIT_DEC, MIN_GAS_PRICE_GWEI } from '../../../ui/app/components/send/send.constants'
import * as Toast from './toast'

const MIN_GAS_PRICE_BN = hexToBn(MIN_GAS_PRICE_GWEI)
const MIN_GAS_LIMIT_BN = new BN(MIN_GAS_LIMIT_DEC)
const emptyAddress = '0x0000000000000000000000000000000000000000'

class PendingTx extends Component {
  static propTypes = {
    network: PropTypes.string,
    buyEth: PropTypes.func,
    cancelTransaction: PropTypes.func,
    cancelAllTransactions: PropTypes.func,
    sendTransaction: PropTypes.func,
    actions: PropTypes.object,
    txData: PropTypes.object,
    selectedAddress: PropTypes.string,
    identities: PropTypes.object,
    accounts: PropTypes.object,
    isToken: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    currentCurrency: PropTypes.string,
    conversionRate: PropTypes.number,
    provider: PropTypes.object,
    index: PropTypes.number,
    blockGasLimit: PropTypes.string,
    tokensToSend: PropTypes.objectOf(BigNumber),
    tokensTransferTo: PropTypes.string,
    unapprovedTxs: PropTypes.object,
  }

  constructor (opts = {}) {
    super()
    this.state = {
      valid: true,
      txData: null,
      submitting: false,
      token: {
        address: emptyAddress,
        symbol: '',
        decimals: 0,
        dataRetrieved: false,
      },
      isToken: false,
      coinName: ethNetProps.props.getNetworkCoinName(opts.network),
    }
    this.tokenInfoGetter = tokenInfoGetter()
  }

  render () {
    const props = this.props
    if (props.isToken || this.state.isToken) {
      if (!this.state.token.dataRetrieved) return null
    }
    const { currentCurrency, blockGasLimit, network, provider, isUnlocked } = props

    const conversionRate = props.conversionRate
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}
    let { isToken, tokensToSend, tokensTransferTo } = props

    const decodedData = txParams.data && abiDecoder.decodeMethod(txParams.data)
    if (decodedData && decodedData.name === 'transfer') {
      isToken = true
      const tokenValBN = new BigNumber(calcTokenAmount(decodedData.params[1].value, this.state.token.decimals))
      const multiplier = Math.pow(10, 18)
      tokensToSend = tokenValBN.mul(multiplier).toString(16)
      tokensTransferTo = decodedData.params[0].value
    }

    // Allow retry txs
    const { lastGasPrice } = txMeta
    let forceGasMin
    if (lastGasPrice) {
      const stripped = ethUtil.stripHexPrefix(lastGasPrice)
      const lastGas = new BN(stripped, 16)
      const priceBump = lastGas.divn('10')
      forceGasMin = lastGas.add(priceBump)
    }

    // Account Details
    const address = txParams.from || props.selectedAddress
    const identity = props.identities[address] || { address: address }
    const account = props.accounts[address]
    const balance = account ? account.balance : '0x0'

    // recipient check
    const isValidAddress = !txParams.to || util.isValidAddress(txParams.to, network)

    // Gas
    const gas = txParams.gas
    const gasBn = hexToBn(gas)
    // default to 8MM gas limit
    const gasLimit = new BN(parseInt(blockGasLimit) || '8000000')
    const safeGasLimitBN = this.bnMultiplyByFraction(gasLimit, 99, 100)
    const saferGasLimitBN = this.bnMultiplyByFraction(gasLimit, 98, 100)
    const safeGasLimit = safeGasLimitBN.toString(10)

    // Gas Price
    const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_BN.toString(16)
    const gasPriceBn = MIN_GAS_PRICE_BN
    txMeta.txParams.gasPrice = '0x' + gasPriceBn.toString('hex')

    const txFeeBn = gasBn.mul(gasPriceBn)
    const valueBn = hexToBn(txParams.value)
    const maxCost = txFeeBn.add(valueBn)

    const dataLength = txParams.data ? (txParams.data.length - 2) / 2 : 0

    const { totalTx, positionOfCurrentTx, nextTxId, prevTxId, showNavigation } = this.getNavigateTxData()

    const balanceBn = hexToBn(balance)
    const insufficientBalance = balanceBn.lt(maxCost)
    const dangerousGasLimit = gasBn.gte(saferGasLimitBN)
    const gasLimitSpecified = txMeta.gasLimitSpecified
    const buyDisabled = insufficientBalance || !this.state.valid || !isValidAddress || this.state.submitting

    const isNotification = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION

    this.inputs = []

    const valueStyle = {
      fontFamily: 'Nunito Bold',
      width: '100%',
      textAlign: 'right',
      fontSize: '14px',
      color: '#333333',
    }

    const dimStyle = {
      color: '#333333',
      marginLeft: '5px',
      fontSize: '14px',
    }


    const isError = txMeta.simulationFails || !isValidAddress || insufficientBalance || (dangerousGasLimit && !gasLimitSpecified)
    return (

      h('div', {
        key: txMeta.id,
      }, [
        h(Toast.ToastComponent, {
          type: Toast.TOAST_TYPE_ERROR,
        }),

        h('form#pending-tx-form', {
          onSubmit: this.onSubmit.bind(this),

        }, [

          // tx info
          h('div', [

            h('.flex-row.flex-center', {
              style: {
                maxWidth: '100%',
                padding: showNavigation ? '20px 20px 50px 20px' : '20px 20px 20px 20px',
                background: 'linear-gradient(#176de2, #7aabff)',
                position: 'relative',
              },
            }, [

              h('div', {
                style: {
                  position: 'absolute',
                  bottom: '20px',
                  width: '100%',
                  textAlign: 'center',
                  color: '#ffffff',
                },
              }, [
                h('h3', {
                  style: {
                    alignSelf: 'center',
                    display: showNavigation ? 'block' : 'none',
                    fontSize: '14px',
                  },
                }, [
                  h('i.fa.white-arrow-left.fa-lg.cursor-pointer', {
                    style: {
                      display: positionOfCurrentTx === 1 ? 'none' : 'inline-block',
                    },
                    onClick: () => props.actions.nextTx(prevTxId),
                  }),
                  ` ${positionOfCurrentTx} of ${totalTx} `,
                  h('i.fa.white-arrow-right.fa-lg.cursor-pointer', {
                    style: {
                      display: positionOfCurrentTx === totalTx ? 'none' : 'inline-block',
                    },
                    onClick: () => props.actions.nextTx(nextTxId),
                  }),
                ])],
              ),

              h(MiniAccountPanel, {
                imageSeed: address,
                picOrder: 'left',
              }, [
                h('div', {
                  style: {
                    marginLeft: '10px',
                  },
                }, [
                  h('div.font-pre-medium', {
                    style: {
                      fontFamily: 'Montserrat Light',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                    },
                  }, accountSummary(identity.name, 6, 4)),

                  h(Copyable, {
                    value: toChecksumAddress(network, address),
                  }, [
                    h('span.font-small', {
                      style: {
                        fontFamily: 'Montserrat UltraLight',
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    }, addressSummary(network, address, 6, 4, false)),
                  ]),

                  h('span.font-small', {
                    style: {
                      fontFamily: 'Montserrat UltraLight',
                    },
                  }, [
                    isToken ? h(TokenBalance, {
                      token: this.state.token,
                      fontSize: '12px',
                    }) : h(EthBalance, {
                      fontSize: '12px',
                      value: balance,
                      conversionRate,
                      currentCurrency,
                      network,
                      showFiat: false,
                      style: {
                        lineHeight: '7px',
                      },
                      inline: true,
                    }),
                  ]),
                ]),
              ]),

              forwardCarrat(),

              this.miniAccountPanelForRecipient(isToken, tokensTransferTo),
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
                !isNotification ? h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
                  onClick: this.goHome.bind(this),
                  style: {
                    position: 'absolute',
                    left: '30px',
                  },
                }) : null,
                'Confirm Transaction',
                isNotification ? h(NetworkIndicator, {
                  network: network,
                  provider: provider,
                  isUnlocked: isUnlocked,
                }) : null,
              ]),

              isError ? h('div', {
                style: {
                  textAlign: 'center',
                  top: '25px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '30px',
                },
              }, [
                txMeta.simulationFails ?
                  h('.error', {
                    style: {
                      fontSize: '12px',
                    },
                  }, 'Transaction Error. Exception thrown in contract code.')
                : null,

                !isValidAddress ?
                  h('.error', {
                    style: {
                      fontSize: '12px',
                    },
                  }, 'Recipient address is invalid. Sending this transaction will result in a loss of ETH. ')
                : null,

                insufficientBalance ?
                  h('.error', {
                    style: {
                      fontSize: '12px',
                    },
                  }, 'Insufficient balance for transaction. ')
                : null,

                (dangerousGasLimit && !gasLimitSpecified) ?
                  h('.error', {
                    style: {
                      fontSize: '12px',
                    },
                  }, 'Gas limit set dangerously high. Approving this transaction is liable to fail. ')
                : null,
              ]) : null,

              // Ether Value
              // Currently not customizable, but easily modified
              // in the way that gas and gasLimit currently are.
              h('.row', [
                h('.cell.label', 'Amount'),
                h(EthBalance, {
                  valueStyle,
                  dimStyle,
                  value: isToken ? tokensToSend/* (new BN(tokensToSend)).mul(1e18)*/ : txParams.value,
                  currentCurrency,
                  conversionRate,
                  network,
                  isToken,
                  tokenSymbol: this.state.token.symbol,
                  showFiat: false,
                }),
              ]),

              // Max Transaction Fee (calculated)
              h('.cell.row', [
                h('.cell.label', 'Transaction Fee'),
                h(EthBalance, {
                  valueStyle,
                  dimStyle,
                  value: txFeeBn.toString(16),
                  currentCurrency,
                  conversionRate,
                  network,
                  showFiat: false,
                }),
              ]),

              h('.cell.row', {
                style: {
                  fontFamily: 'Montserrat UltraLight',
                },
              }, [
                h('.cell.label', 'Total'),
                h('.cell.value', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }, [
                  h(EthBalance, {
                    valueStyle,
                    dimStyle,
                    value: maxCost.toString(16),
                    currentCurrency,
                    conversionRate,
                    inline: true,
                    network,
                    labelColor: 'black',
                    fontSize: '16px',
                    showFiat: false,
                  }),
                ]),
              ]),

            ]), // End of Table

          ]),

          h('style', `
            .conf-buttons button {
              margin-left: 10px;
            }
          `),

          // send + cancel
          h('.flex-row.flex-space-around.conf-buttons', {
            style: {
              display: 'flex',
              justifyContent: 'flex-end',
              margin: '14px 30px',
            },
          }, [
            // Accept Button or Buy Button
            h('button.cancel.btn-red', {
              onClick: props.cancelTransaction,
              style: { marginLeft: '10px' },
            }, 'Cancel'),
            insufficientBalance ? h('button.btn-green', { onClick: props.buyEth }, `Send ${this.state.coinName}`) :
              h('input.confirm', {
                type: 'submit',
                value: 'Submit',
                style: { marginLeft: '10px' },
                disabled: buyDisabled,
              }),

          ]),
          showNavigation ? h('.flex-row.flex-space-around.conf-buttons', {
            style: {
              display: 'flex',
              justifyContent: 'flex-end',
              margin: '14px 30px',
            },
          }, [
            h('button.cancel.btn-red', {
              onClick: props.cancelAllTransactions,
            }, 'Cancel All'),
          ]) : null,
        ]),
      ])
    )
  }

  miniAccountPanelForRecipient (isToken, tokensTransferTo) {
    const props = this.props
    const txData = props.txData
    const txParams = txData.txParams || {}
    const isContractDeploy = !('to' in txParams)
    const to = isToken ? tokensTransferTo : txParams.to

    // If it's not a contract deploy, send to the account
    if (!isContractDeploy) {
      return h(MiniAccountPanel, {
          imageSeed: txParams.to,
          picOrder: 'right',
        }, [
          h('div', {
            style: {
              marginRight: '10px',
            },
          }, [
            h('span.font-pre-medium', {
              style: {
                fontFamily: 'Montserrat Light',
                color: '#ffffff',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              },
            }, accountSummary(nameForAddress(to, props.identities, props.network)), 6, 4),

            h(Copyable, {
              value: toChecksumAddress(props.network, to),
            }, [
              h('span.font-small', {
                style: {
                  fontFamily: 'Montserrat UltraLight',
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }, addressSummary(props.network, to, 6, 4, false)),
            ]),
          ]),
        ])
    } else {
      return h(MiniAccountPanel, {
        picOrder: 'right',
      }, [

        h('span.font-small', {
          style: {
            fontFamily: 'Nunito Bold',
            color: '#ffffff',
          },
        }, 'New Contract'),

      ])
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount () {
    const txMeta = this.gatherTxMeta()
    const txParams = txMeta.txParams || {}
    if (this.props.isToken || this.state.isToken) {
      return this.updateTokenInfo(txParams)
    }
    const decodedData = txParams.data && abiDecoder.decodeMethod(txParams.data)
    if (decodedData && decodedData.name === 'transfer') {
      return this.updateTokenInfo(txParams)
    }
  }

  componentWillUnmount () {
    this.setState({
      token: {
        address: emptyAddress,
        symbol: '',
        decimals: 0,
        dataRetrieved: false,
      },
      isToken: false,
    })
  }

  updateTokenInfo = async function (txParams) {
    const tokenParams = await this.tokenInfoGetter(txParams.to)
    this.setState({
      token: {
        address: txParams.to,
        symbol: tokenParams.symbol,
        decimals: tokenParams.decimals,
        dataRetrieved: true,
      },
      isToken: true,
    })
  }

  gasPriceChanged (newBN, valid) {
    log.info(`Gas price changed to: ${newBN.toString(10)}`)
    const txMeta = this.gatherTxMeta()
    txMeta.txParams.gasPrice = '0x' + newBN.toString('hex')
    this.setState({
      txData: clone(txMeta),
      valid,
    })
  }

  gasLimitChanged (newBN, valid) {
    log.info(`Gas limit changed to ${newBN.toString(10)}`)
    const txMeta = this.gatherTxMeta()
    txMeta.txParams.gas = '0x' + newBN.toString('hex')
    this.setState({
      txData: clone(txMeta),
      valid,
    })
  }

  resetGasFields () {
    log.debug(`pending-tx resetGasFields`)

    this.inputs.forEach((hexInput) => {
      if (hexInput) {
        hexInput.setValid()
      }
    })

    this.setState({
      txData: null,
      valid: true,
    })
  }

  onSubmit (event) {
    event.preventDefault()
    const txMeta = this.gatherTxMeta()
    const valid = this.checkValidity()

    txMeta.txParams.gasPrice = '0x' + MIN_GAS_PRICE_BN.toString('hex')
    this.setState({
      txData: clone(txMeta),
      valid: true,
    })

    this.setState({ valid, submitting: true })
    if (valid && this.verifyGasParams()) {
      this.props.sendTransaction(txMeta, event)
    } else {
      this.props.actions.displayWarning('Invalid Gas Parameters')
      this.setState({ submitting: false })
    }
  }

  checkValidity () {
    const form = this.getFormEl()
    const valid = form.checkValidity()
    return valid
  }

  getFormEl () {
    const form = document.querySelector('form#pending-tx-form')
    // Stub out form for unit tests:
    if (!form) {
      return { checkValidity () { return true } }
    }
    return form
  }

// After a customizable state value has been updated,
  gatherTxMeta () {
    log.debug(`pending-tx gatherTxMeta`)
    const props = this.props
    const state = this.state
    const txData = clone(state.txData) || clone(props.txData)

    log.debug(`UI has defaulted to tx meta ${JSON.stringify(txData)}`)
    return txData
  }

  verifyGasParams () {
    // We call this in case the gas has not been modified at all
    if (!this.state) { return true }
    return (
      this._notZeroOrEmptyString(this.state.gas) &&
      this._notZeroOrEmptyString(this.state.gasPrice)
    )
  }

  _notZeroOrEmptyString (obj) {
    return obj !== '' && obj !== '0x0'
  }

  bnMultiplyByFraction (targetBN, numerator, denominator) {
    const numBN = new BN(numerator)
    const denomBN = new BN(denominator)
    return targetBN.mul(numBN).div(denomBN)
  }

  goHome (event) {
    this.stopPropagation(event)
    this.props.actions.goHome()
  }

  stopPropagation (event) {
    if (event.stopPropagation) {
      event.stopPropagation()
    }
  }

  getNavigateTxData () {
    const { unapprovedTxs, network, txData: { id } = {} } = this.props
    const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) => unapprovedTxs[key].metamaskNetworkId === network)
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {})
    const enumUnapprovedTxs = Object.keys(currentNetworkUnapprovedTxs)
    const currentPosition = enumUnapprovedTxs.indexOf(id ? id.toString() : '')

    return {
      totalTx: enumUnapprovedTxs.length,
      positionOfCurrentTx: currentPosition + 1,
      nextTxId: enumUnapprovedTxs[currentPosition + 1],
      prevTxId: enumUnapprovedTxs[currentPosition - 1],
      //showNavigation: enumUnapprovedTxs.length > 1,
      showNavigation: false // Workaound: Disable as there is a bug in the navigation.
    }
  }

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

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  return {
    identities: state.metamask.identities,
    accounts,
    selectedAddress: state.metamask.selectedAddress,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    index: state.appState.currentView.key || 0,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
    isUnlocked: state.metamask.isUnlocked,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    computedBalances: state.metamask.computedBalances,
    pendingTxIndex: state.appState.currentView.pendingTxIndex || 0,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      nextTx: (txId) => dispatch(actions.nextTx(txId)),
      displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
      goHome: () => dispatch(actions.goHome()),
    },
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(PendingTx)
