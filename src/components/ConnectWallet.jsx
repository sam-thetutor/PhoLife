import { useState } from 'react'
import PropTypes from 'prop-types'

const ConnectWallet = ({ account, setAccount }) => {
  const [connecting, setConnecting] = useState(false)

  const connectWallet = async () => {
    try {
      setConnecting(true)
      const { ethereum } = window
      if (!ethereum) {
        alert('Please install MetaMask!')
        return
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })
      setAccount(accounts[0])
    } catch (error) {
      console.error('Error connecting wallet:', error)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="wallet-container">
      {account ? (
        <div className="account-info">
          {`${account.slice(0, 6)}...${account.slice(-4)}`}
        </div>
      ) : (
        <button 
          onClick={connectWallet} 
          disabled={connecting}
          className="connect-button"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  )
}

ConnectWallet.propTypes = {
  account: PropTypes.string,
  setAccount: PropTypes.func.isRequired
}

export default ConnectWallet 