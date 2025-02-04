import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import Gallery from './components/Gallery'
import Upload from './components/Upload'
import ConnectWallet from './components/ConnectWallet'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { create } from '@web3-storage/w3up-client'
import PrivateFolder from './components/PrivateFolder'

const VITE_SPACE_LOGIN="did:key:z6MkqXuQNBGX3KJuvN5rRZjerfLvtBuUDWXGNiEH8wPP8cBq"
const VITE_WEB3STORAGE_EMAIL="smartskillsweb3@gmail.com"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

// Initialize web3.storage client
const initializeWeb3Storage = async () => {
  try {
    const web3Client = await create()
    await web3Client.login(VITE_WEB3STORAGE_EMAIL)
    await web3Client.setCurrentSpace(VITE_SPACE_LOGIN)
    return web3Client
  } catch (error) {
    console.error("Error initializing web3.storage:", error)
    throw error
  }
}

function AppContent() {
  const [account, setAccount] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  // Initialize web3.storage using React Query
  const { data: web3Client, isLoading: isInitializing } = useQuery({
    queryKey: ['web3Storage'],
    queryFn: initializeWeb3Storage,
    retry: 2,
  })

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
      const savedImages = localStorage.getItem('uploadedImages')
      if (savedImages) {
        setImages(JSON.parse(savedImages))
      }
    } catch (error) {
      console.error('Error loading images:', error)
    }
    setLoading(false)
  }

  const handleUploadComplete = (uploadedFiles) => {
    console.log("uploadedFiles:", uploadedFiles)
    const newImages = [...images, ...uploadedFiles]
    setImages(newImages)
    localStorage.setItem('uploadedImages', JSON.stringify(newImages))
  }

  useEffect(() => {
    checkWalletConnection()
  }, [])

  if (isInitializing) {
    return <div className="loading">Initializing web3.storage...</div>
  }

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
            onUploadComplete={handleUploadComplete}
            web3Client={web3Client}
          />
          <PrivateFolder
            web3Client={web3Client}
            onUploadComplete={handleUploadComplete}
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
