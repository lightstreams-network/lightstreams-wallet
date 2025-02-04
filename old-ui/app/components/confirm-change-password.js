const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

module.exports = connect(mapStateToProps)(ConfirmChangePassword)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
    dPath: state.metamask.dPath,
  }
}

inherits(ConfirmChangePassword, Component)
function ConfirmChangePassword () {
  Component.call(this)
}

ConfirmChangePassword.prototype.render = function () {
  const state = this.props
  const passwordInputAdditionalStyle = {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  }
  return h('.flex-column.flex-grow', {
    style: {
      overflowX: 'auto',
      overflowY: 'hidden',
    },
  }, [
    // subtitle and nav
    h('.section-title.flex-row.flex-center', [
      h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
        onClick: () => {
          this.props.dispatch(actions.showConfigPage())
        },
        style: {
          position: 'absolute',
          left: '30px',
        },
      }),
      h('h2.page-subtitle', 'Change Password'),
    ]),
    h('div', {
      style: {
        margin: '0 30px',
      },
    }, [
      h('.error', {
        style: {
          display: state.warning ? 'block' : 'none',
        },
      }, state.warning),
      h('span', 'Old password'),
      h('input.large-input', {
        type: 'password',
        id: 'old-password-box',
        ref: 'OldPasswordBox',
        style: passwordInputAdditionalStyle,
      }),
      h('span', 'New password'),
      h('input.large-input', {
        type: 'password',
        id: 'new-password-box',
        ref: 'NewPasswordBox',
        style: passwordInputAdditionalStyle,
      }),
      h('span', 'Confirm new password'),
      h('input.large-input', {
        type: 'password',
        id: 'password-box-confirm',
        ref: 'PasswordBoxConfirm',
        style: passwordInputAdditionalStyle,
        onKeyPress: this.createOnEnter.bind(this),
      }),
    ]),
    h('.flex-row.flex-right', {
      style: {
        marginRight: '30px',
      },
    }, [
      h('button.btn-grey',
        {
          onClick: () => {
            this.props.dispatch(actions.showConfigPage())
          },
        },
        'Cancel'),
      h('button',
        {
          onClick: () => {
            this.ChangePassword()
          },
        },
        'Save'),
    ]),
  ])
}

ConfirmChangePassword.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
}

ConfirmChangePassword.prototype.createOnEnter = function (event) {
  if (event.key === 'Enter') {
    this.ChangePassword()
  }
}

ConfirmChangePassword.prototype.ChangePassword = function () {
  const { props, refs } = this
  const oldPasswordBox = refs.OldPasswordBox
  const oldPassword = oldPasswordBox.value
  const newPasswordBox = refs.NewPasswordBox
  const newPassword = newPasswordBox.value
  const newPasswordConfirmBox = refs.PasswordBoxConfirm
  const newPasswordConfirm = newPasswordConfirmBox.value

  if (newPassword.length < 8) {
    this.warning = 'Password not long enough'

    props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (newPassword !== newPasswordConfirm) {
    this.warning = 'Passwords don\'t match'
    props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (newPassword === oldPassword) {
    this.warning = 'New password should differ from the current one'
    props.dispatch(actions.displayWarning(this.warning))
    return
  }
  props.dispatch(actions.changePassword(oldPassword, newPassword, this.props.dPath))
    .then(() => {
      props.dispatch(actions.showConfigPage())
    })
    .catch((err) => {
      this.warning = err.message
      props.dispatch(actions.displayWarning(this.warning))
    })
}
