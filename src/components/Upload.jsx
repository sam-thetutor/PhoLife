import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import FilePreview from './FilePreview'
import UploadProgress from './UploadProgress'

const Upload = ({ account, onUploadComplete, web3Client }) => {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [uploadSpeed, setUploadSpeed] = useState({})
  const [errors, setErrors] = useState([])

  const handleValidationError = useCallback((error) => {
    setErrors(prev => [...prev, error])
    setTimeout(() => {
      setErrors(prev => prev.slice(1))
    }, 5000)
  }, [])

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(selectedFiles)
    setProgress({})
    setUploadSpeed({})
    setErrors([])
  }

  const updateProgress = (fileName, loaded, total, startTime) => {
    const currentTime = Date.now()
    const timeElapsed = (currentTime - startTime) / 1000 // seconds
    const speed = loaded / timeElapsed // bytes per second
    
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

    setUploading(true)
    try {
      if (!web3Client) {
        throw new Error("Web3 storage not initialized")
      }

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const startTime = Date.now()
            const cid = await web3Client.uploadFile(file, {
              onProgress: (event) => {
                updateProgress(file.name, event.loaded, event.total, startTime)
              }
            })

            return {
              id: cid.toString(),
              url: `https://${cid.toString()}.ipfs.w3s.link`,
              name: file.name,
              size: file.size,
              type: file.type,
              timestamp: new Date().toISOString()
            }
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error)
            handleValidationError(`Failed to upload ${file.name}: ${error.message}`)
            throw error
          }
        })
      )

      console.log("Successfully uploaded files:", uploadedFiles)
      setFiles([])
      onUploadComplete(uploadedFiles)
      
    } catch (error) {
      console.error('Error uploading files:', error)
      handleValidationError('Failed to upload files: ' + error.message)
    } finally {
      setUploading(false)
      setProgress({})
      setUploadSpeed({})
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

      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="previews-container">
          {Array.from(files).map((file, index) => (
            <div key={index} className="preview-item">
              <FilePreview
                file={file}
                onValidationError={handleValidationError}
              />
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
  onUploadComplete: PropTypes.func.isRequired,
  web3Client: PropTypes.object.isRequired
}

export default Upload 