import PropTypes from 'prop-types'

const UploadProgress = ({ file, progress, speed }) => {
  return (
    <div className="upload-progress">
      <div className="progress-info">
        <span className="filename">{file.name}</span>
        <span className="progress-text">{progress}%</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
      {speed && (
        <div className="upload-speed">
          {(speed / 1024 / 1024).toFixed(2)} MB/s
        </div>
      )}
    </div>
  )
}

UploadProgress.propTypes = {
  file: PropTypes.object.isRequired,
  progress: PropTypes.number.isRequired,
  speed: PropTypes.number
}

export default UploadProgress 