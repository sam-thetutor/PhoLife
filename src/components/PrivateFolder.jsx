import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { AiFillLock, AiFillUnlock } from 'react-icons/ai'
import { encrypt, decrypt, hashPassword } from '../utils/encryption'

const PrivateFolder = ({ web3Client, onUploadComplete }) => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isSetup, setIsSetup] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if password has been set up
    const hashedPassword = localStorage.getItem('pholife_private_folder_hash')
    setIsSetup(!!hashedPassword)
  }, [])

  const handleSetupPassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      // Hash password for storage
      const hashedPassword = await hashPassword(password)
      localStorage.setItem('pholife_private_folder_hash', hashedPassword)
      
      // Create an encryption test to verify password later
      const testData = new TextEncoder().encode('test')
      const encryptedTest = await encrypt(testData, password)
      localStorage.setItem('pholife_private_folder_test', JSON.stringify(Array.from(encryptedTest)))
      
      setIsSetup(true)
      setIsUnlocked(true)
      setError('')
    } catch (error) {
      console.error('Error setting up password:', error)
      setError('Failed to set up password')
    }
  }

  const handleUnlock = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      // Verify password by attempting to decrypt test data
      const encryptedTest = new Uint8Array(JSON.parse(localStorage.getItem('pholife_private_folder_test')))
      await decrypt(encryptedTest, password)
      
      setIsUnlocked(true)
      setError('')
    } catch (error) {
      console.error('Error unlocking folder:', error)
      setError('Incorrect password')
    }
  }

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files))
  }

  const uploadPrivateFiles = async () => {
    if (!password || !files.length) return

    setUploading(true)
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          // Encrypt file data
          const encryptedData = await encrypt(await file.arrayBuffer(), password)
          const encryptedBlob = new Blob([encryptedData])
          const encryptedFile = new File([encryptedBlob], file.name, {
            type: 'application/encrypted'
          })

          // Upload encrypted file
          const cid = await web3Client.uploadFile(encryptedFile)
          
          return {
            id: cid.toString(),
            url: `https://${cid.toString()}.ipfs.w3s.link`,
            name: file.name,
            timestamp: new Date().toISOString(),
            isPrivate: true,
            size: file.size
          }
        })
      )

      onUploadComplete(uploadedFiles)
      setFiles([])
    } catch (error) {
      console.error('Error uploading private files:', error)
      setError('Failed to upload private files')
    } finally {
      setUploading(false)
    }
  }

  if (!isSetup) {
    return (
      <div className="private-folder setup">
        <AiFillLock size={24} />
        <h3>Set Up Private Folder</h3>
        <div className="password-setup-form">
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handleSetupPassword}>Set Password</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <p className="password-hint">
          Password must be at least 6 characters long.
          <br />
          Keep this password safe - it cannot be recovered!
        </p>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <div className="private-folder locked">
        <AiFillLock size={24} />
        <h3>Private Folder</h3>
        <div className="password-form">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleUnlock}>Unlock</button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    )
  }

  return (
    <div className="private-folder unlocked">
      <div className="folder-header">
        <div className="folder-title">
          <AiFillUnlock size={24} />
          <h3>Private Folder</h3>
        </div>
        <button 
          className="lock-button"
          onClick={() => {
            setIsUnlocked(false)
            setPassword('')
          }}
        >
          Lock Folder
        </button>
      </div>

      <div className="upload-section">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        {files.length > 0 && (
          <div className="selected-files">
            {files.length} files selected
          </div>
        )}
        <button
          onClick={uploadPrivateFiles}
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Encrypting & Uploading...' : 'Upload Private Files'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}

PrivateFolder.propTypes = {
  web3Client: PropTypes.object.isRequired,
  onUploadComplete: PropTypes.func.isRequired
}

export default PrivateFolder 