import React, { Component } from 'react'
import PendingTxDetails from './pending-msg-details'
import PropTypes from 'prop-types'

export default class PendingMsg extends Component {
  static propTypes = {
    txData: PropTypes.object,
    cancelMessage: PropTypes.func,
    signMessage: PropTypes.func,
  }

  render () {
    const state = this.props
    const msgData = state.txData

    return (
      <div key={msgData.id} style={{height: '100%'}}>
        <h3 style={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
          margin: '20px',
        }}>Connect Application</h3>
        <div className="error" style={{
          margin: '30px',
          width: 'auto',
        }}>
        </div>
        <PendingTxDetails {...state}/>
        <div className="flex-row flex-space-around" style={{
          marginRight: '30px',
          float: 'right',
          display: 'block',
        }}>
          <button style={{marginRight: '10px'}} onClick={state.cancelMessage}>Cancel</button>
          <button onClick={state.approveMessage}>Connect</button>
        </div>
      </div>
    )
  }
}
