const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

module.exports = connect(mapStateToProps)(CoindealForm)

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
  }
}

inherits(CoindealForm, Component)

function CoindealForm () {
  Component.call(this)
}

CoindealForm.prototype.render = function () {

  return h('.flex-column', {
    style: {
      width: '100%',
    },
  }, [
    h('.flex-row', {
      style: {
        margin: '30px',
        marginTop: '0px',
      },
    }, [
      h('p.cursor-pointer', {
        onClick: this.toCoindeal.bind(this),
      }, [h('span', {style: {marginRight: '10px', color: '#6729a8'}}, 'Continue to Coindeal')]),
    ]),
  ])
}

CoindealForm.prototype.toCoindeal = function () {
  const props = this.props
  const address = props.buyView.buyAddress
  props.dispatch(actions.buyEth({ network: '1', address, amount: 0, ind: 1 }))
}

CoindealForm.prototype.renderLoading = function () {
  return h('img', {
    style: {
      width: '27px',
      marginRight: '-27px',
    },
    src: 'images/loading.svg',
  })
}
