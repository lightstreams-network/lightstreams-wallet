import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
const h = require('react-hyperscript')
const { confirmSeedWords, showAccountDetail } = require('../../../../ui/app/actions')
const { exportAsFile } = require('../../util')

class CreateVaultCompleteScreen extends Component {

  static propTypes = {
    seed: PropTypes.string,
    cachedSeed: PropTypes.string,
    confirmSeedWords: PropTypes.func,
    showAccountDetail: PropTypes.func,
  };

  render () {
    const state = this.props
    const seed = state.seed || state.cachedSeed || ''
    const wordsCount = seed.split(' ').length

    return (

      h('.initialize-screen.flex-column.flex-center.flex-grow', [

        h('h3.flex-center.section-title', {
          style: {
            background: '#ffffff',
            color: '#333333',
            marginBottom: 8,
            width: '100%',
            padding: '30px 6px 6px 6px',
          },
        }, [
          'Secret Phrase',
        ]),

        h('div', {
          style: {
            fontSize: '14px',
            margin: '15px 30px',
            textAlign: 'left',
          },
        }, [
          h('p',
            `Please record the following secret phrase and keep it safe.`),
        ]),

        h('textarea.twelve-word-phrase', {
          readOnly: true,
          value: seed,
        }),

        h('button', {
          onClick: () => exportAsFile(`secret_phrase`, seed),
          style: {
            margin: '10px',
            fontSize: '0.9em',
          },
        }, 'Save As File'),

        h('div', {
          style: {
            fontSize: '14px',
            margin: '10px 30px',
            textAlign: 'left',
          },
        }, [
          h('div.error',
            `If you forget your password then this phrase is the only way to recover your wallet. Do not reveal it to anyone as it can be used to take control of your wallet and steal your funds.`),
        ]),

        h('button', {
          onClick: () => this.confirmSeedWords()
            .then(account => this.showAccountDetail(account)),
          style: {
            margin: '5px 20px',
            fontSize: '0.9em',
          },
        }, 'I confirm that I\'ve recorded the phrase'),
      ])
    )
  }

  confirmSeedWords () {
    return this.props.confirmSeedWords()
  }

  showAccountDetail (account) {
    return this.props.showAccountDetail(account)
  }
}

function mapStateToProps (state) {
  return {
    seed: state.appState.currentView.seedWords,
    cachedSeed: state.metamask.seedWords,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirmSeedWords: () => dispatch(confirmSeedWords()),
    showAccountDetail: (account) => dispatch(showAccountDetail(account)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CreateVaultCompleteScreen)
