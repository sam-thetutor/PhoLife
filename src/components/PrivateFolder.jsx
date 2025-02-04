import { useState } from 'react'
import { AiFillLock, AiFillUnlock } from 'react-icons/ai'
import { encrypt } from '../utils/encryption'
import { addPhoto } from '../utils/contract'
import { useApp } from '../context/AppContext'

const PrivateFolder = () => {
  const { 
    wallet,
    web3Client,
    addPhotos,
    isPrivateFolderSetup,
    isSettingUpFolder,
    privateFolderError,
    setupPrivateFolder,
    isPrivateFolderUnlocked,
    verifyPrivateFolderAccess,
    lockPrivateFolder
  } = useApp()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSetupPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await setupPrivateFolder(password)
      setError('')
    } catch (error) {
      setError(error.message)
    }
  }

  const handleUnlock = async () => {
    try {
      await verifyPrivateFolderAccess(password)
      setError('')
    } catch (error) {
      setError(error.message)
    }
  }

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files))
  }

  const uploadPrivateFiles = async () => {
    if (!wallet?.signer?.provider) {
      setError('Please connect your wallet first')
      return
    }

    if (!password || !files.length) return

    setUploading(true)
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          // Create a thumbnail for preview
          const thumbnail = await createImageThumbnail(file)
          
          // Encrypt the original file
          const encryptedData = await encrypt(await file.arrayBuffer(), password)
          const encryptedBlob = new Blob([encryptedData])
          const encryptedFile = new File([encryptedBlob], file.name, {
            type: 'application/encrypted'
          })

          // Upload both encrypted file and thumbnail
          const [encryptedCid, thumbnailCid] = await Promise.all([
            web3Client.uploadFile(encryptedFile),
            web3Client.uploadFile(thumbnail)
          ])

          const urls = {
            encrypted: `https://${encryptedCid.toString()}.ipfs.w3s.link`,
            thumbnail: `https://${thumbnailCid.toString()}.ipfs.w3s.link`
          }
          
          console.log('Adding private photo with isPrivate=true')
          // Store URLs as stringified JSON in the contract
          await addPhoto(
            wallet.signer, 
            JSON.stringify(urls), 
            file.name, 
            file.size, 
            true
          )
          
          return {
            id: encryptedCid.toString(),
            url: JSON.stringify(urls), // Store the stringified URLs
            name: file.name,
            timestamp: new Date().toISOString(),
            size: file.size,
            isPrivate: true
          }
        })
      )

      console.log('Uploaded private files:', uploadedFiles)
      addPhotos(uploadedFiles)
      setFiles([])
    } catch (error) {
      console.error('Error uploading private files:', error)
      setError('Failed to upload private files')
    } finally {
      setUploading(false)
    }
  }

  // Helper function to create thumbnail
  const createImageThumbnail = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Set thumbnail size
          const maxSize = 300
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob
          canvas.toBlob((blob) => {
            resolve(new File([blob], `${file.name}-thumb.jpg`, { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.7)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  if (!isPrivateFolderSetup) {
    if (!wallet?.signer?.provider) {
      return (
        <div className="private-folder setup">
          <AiFillLock size={24} />
          <h3>Set Up Private Folder</h3>
          <p className="setup-message">
            Please connect your wallet to set up the private folder
          </p>
        </div>
      )
    }

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
          <button 
            onClick={handleSetupPassword}
            disabled={isSettingUpFolder}
          >
            {isSettingUpFolder ? 'Setting Up...' : 'Set Password'}
          </button>
        </div>
        {(error || privateFolderError) && (
          <div className="error-message">
            {error || privateFolderError.message}
          </div>
        )}
        <p className="password-hint">
          Password must be at least 6 characters long.
          <br />
          Keep this password safe - it cannot be recovered!
        </p>
      </div>
    )
  }

  if (!isPrivateFolderUnlocked && isPrivateFolderSetup) {
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
            lockPrivateFolder()
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

export default PrivateFolder 