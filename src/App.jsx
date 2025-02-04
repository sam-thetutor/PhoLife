import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import Gallery from './components/Gallery'
import Upload from './components/Upload'
import ConnectWallet from './components/ConnectWallet'

function App() {
  const [account, setAccount] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert('Please install MetaMask!')
        return
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        loadImages()
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const loadImages = async () => {
    setLoading(true)
    try {
      // TODO: Implement loading images from Filecoin
      // This is where you'll integrate with your smart contract
      setImages([])
    } catch (error) {
      console.error('Error loading images:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkWalletConnection()
  }, [])

  return (
    <div className="app-container">
      <header>
        <h1>Pholife 📸</h1>
        <ConnectWallet account={account} setAccount={setAccount} />
      </header>

      {account ? (
        <>
          <Upload 
            account={account} 
            onUploadComplete={loadImages}
          />
          <Gallery 
            images={images} 
            loading={loading}
          />
        </>
      ) : (
        <div className="connect-prompt">
          Please connect your wallet to use Pholife
        </div>
      )}
    </div>
  )
}

export default App
