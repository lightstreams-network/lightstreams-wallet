import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class ConfirmLoginNodeMsg extends Component {
  static propTypes = {
    txData: PropTypes.object,
    cancelMessage: PropTypes.func,
    signMessage: PropTypes.func,
  }

  render () {
    const state = this.props
    const msgData = state.txData
    const msgParams = msgData.msgParams

    return (
      <div key={msgData.id} style={{height: '100%'}}>
      <h3 style={{
          fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            margin: '10px',
        }}>Sign in</h3>
    <div className="tx-data flex-column flex-justify-center flex-grow select-none" style={{
      margin: '0 10px',
    }}>
  <div className="flex-column flex-space-between">
      </div>
      <div style={{
        padding: '20px',
        marginTop: '20px',
        width: 'auto',
        color: 'rgb(73, 95, 117)',
        background: 'white',
    }}>
    <p>Approve Sign in:</p>
      <br/>
    <p style={{color: 'black', wordBreak: 'break-word'}}>{msgParams.origin}</p>

    <div className="flex-row flex-space-around" style={{
      marginRight: '30px',
        float: 'right',
        display: 'block',
    }}>
  <button style={{marginRight: '10px', marginTop: '50px', background: '#df2265'}} onClick={state.cancelMessage}>Cancel</button>
      <button onClick={state.approveMessage}>Sign in</button>
      </div>

    </div>
    </div>


      </div>
    )
  }
}
