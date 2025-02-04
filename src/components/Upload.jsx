import { useState } from 'react'
import PropTypes from 'prop-types'
import FilePreview from './FilePreview'
import UploadProgress from './UploadProgress'
import { addPhoto } from '../utils/contract'
import { useApp } from '../context/AppContext'

const Upload = () => {
  const { wallet, web3Client, addPhotos } = useApp()
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [uploadSpeed, setUploadSpeed] = useState({})
  const [error, setError] = useState('')

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files))
    setProgress({})
    setUploadSpeed({})
    setError('')
  }

  const updateProgress = (fileName, loaded, total, startTime) => {
    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000
    const speed = loaded / timeElapsed
    
    setProgress(prev => ({
      ...prev,
      [fileName]: Math.round((loaded / total) * 100)
    }))
    
    setUploadSpeed(prev => ({
      ...prev,
      [fileName]: speed
    }))
  }

  const uploadToFilecoin = async () => {
    if (files.length === 0) return
    if (!wallet?.signer?.provider) {
      setError('Please connect your wallet first')
      return
    }

    setUploading(true)
    setError('')

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const startTime = Date.now()
          const cid = await web3Client.uploadFile(file, {
            onProgress: (event) => {
              updateProgress(file.name, event.loaded, event.total, startTime)
            }
          })
          
          const url = `https://${cid.toString()}.ipfs.w3s.link`
          
          await addPhoto(wallet.signer, url, file.name, file.size, false)
          
          return {
            id: cid.toString(),
            url,
            name: file.name,
            timestamp: new Date().toISOString(),
            size: file.size,
            isPrivate: false
          }
        })
      )

      addPhotos(uploadedFiles)
      setFiles([])
      setProgress({})
      setUploadSpeed({})
    } catch (error) {
      console.error('Error uploading files:', error)
      setError(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="previews-container">
          {Array.from(files).map((file, index) => (
            <div key={index} className="preview-item">
              <FilePreview file={file} />
              {progress[file.name] !== undefined && (
                <UploadProgress
                  file={file}
                  progress={progress[file.name]}
                  speed={uploadSpeed[file.name]}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={uploadToFilecoin}
        disabled={uploading || files.length === 0}
        className="upload-button"
      >
        {uploading ? 'Uploading to Filecoin...' : 'Upload to Filecoin'}
      </button>
    </div>
  )
}

Upload.propTypes = {
  account: PropTypes.string.isRequired,
  signer: PropTypes.object,
  onUploadComplete: PropTypes.func.isRequired,
  web3Client: PropTypes.object.isRequired
}

export default Upload 