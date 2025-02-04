import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const FilePreview = ({ file, onValidationError }) => {
  const [preview, setPreview] = useState('')
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (!file) return

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      onValidationError(`File ${file.name} is too large. Maximum size is 10MB`)
      setIsValid(false)
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      onValidationError(`File ${file.name} is not a supported image type`)
      setIsValid(false)
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setIsValid(true)

    // Clean up
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!isValid) return null

  return (
    <div className="file-preview">
      <img src={preview} alt={file.name} />
      <div className="file-info">
        <span className="file-name">{file.name}</span>
        <span className="file-size">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
    </div>
  )
}

FilePreview.propTypes = {
  file: PropTypes.object.isRequired,
  onValidationError: PropTypes.func.isRequired
}

export default FilePreview 