// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PhotoStorage {
    struct Photo {
        string url;
        string name;
        uint256 timestamp;
        uint256 size;
        bool isPrivate;
    }

    // Single mapping for all photos
    mapping(address => Photo[]) public userPhotos;
    
    // Mapping to store encrypted passwords
    mapping(address => string) public privatefolderHashes;

    // Events
    event PhotoAdded(address indexed user, string url, bool isPrivate);
    event PasswordSet(address indexed user);

    // Add a new photo
    function addPhoto(
        string memory _url,
        string memory _name,
        uint256 _size,
        bool _isPrivate
    ) public {
        Photo memory newPhoto = Photo({
            url: _url,
            name: _name,
            timestamp: block.timestamp,
            size: _size,
            isPrivate: _isPrivate
        });

        userPhotos[msg.sender].push(newPhoto);
        emit PhotoAdded(msg.sender, _url, _isPrivate);
    }

    // Set encrypted password hash
    function setPrivateFolderHash(string memory _hash) public {
        privatefolderHashes[msg.sender] = _hash;
        emit PasswordSet(msg.sender);
    }

    // Get all photos for the caller
    function getPhotos() public view returns (Photo[] memory) {
        return userPhotos[msg.sender];
    }

    // Get private folder hash
    function getPrivateFolderHash() public view returns (string memory) {
        return privatefolderHashes[msg.sender];
    }

    // Helper function to get the length of a user's photos
    function getUserPhotosLength(address _user) public view returns (uint256) {
        return userPhotos[_user].length;
    }

    // Helper function to get a specific photo by index
    function getPhotoByIndex(uint256 _index) public view returns (Photo memory) {
        require(_index < userPhotos[msg.sender].length, "Index out of bounds");
        return userPhotos[msg.sender][_index];
    }

    // Helper function to check if private folder is set up
    function isPrivateFolderSetup() public view returns (bool) {
        return bytes(privatefolderHashes[msg.sender]).length > 0;
    }
} 