import { useState } from 'react'
import PropTypes from 'prop-types'

const Upload = ({ account, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(selectedFiles)
  }

  const uploadToFilecoin = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      // TODO: Implement file upload to Filecoin
      // 1. Upload files to IPFS
      // 2. Store IPFS hashes in Filecoin
      // 3. Update smart contract with storage details
      
      setFiles([])
      onUploadComplete()
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {files.length > 0 && (
        <div className="selected-files">
          {files.length} files selected
        </div>
      )}
      <button
        onClick={uploadToFilecoin}
        disabled={uploading || files.length === 0}
      >
        {uploading ? 'Uploading...' : 'Upload to Filecoin'}
      </button>
    </div>
  )
}

Upload.propTypes = {
  account: PropTypes.string.isRequired,
  onUploadComplete: PropTypes.func.isRequired
}

export default Upload 