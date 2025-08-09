// Application State
let currentState = {
    currentUser: null,
    posts: [],
    messages: [],
    theme: 'light',
    currentScreen: 'feedScreen'
};

// DOM Elements
const elements = {
    headerProfilePic: document.getElementById('headerProfilePic'),
    themeToggle: document.getElementById('themeToggle'),
    searchBtn: document.getElementById('searchBtn'),
    searchBackBtn: document.getElementById('searchBackBtn'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    createPostBtn: document.getElementById('createPostBtn'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    publishPostBtn: document.getElementById('publishPostBtn'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    postEditor: document.getElementById('postEditor'),
    mediaPreview: document.getElementById('mediaPreview'),
    postsContainer: document.getElementById('postsContainer'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    profilePreview: document.getElementById('profilePreview'),
    coverPreview: document.getElementById('coverPreview')
};

// Initialize App
function initApp() {
    loadState();
    setupEventListeners();
    renderPosts();
    updateTheme();
    showScreen(currentState.currentScreen);
}

// Load State from localStorage
function loadState() {
    const savedState = localStorage.getItem('sbiForumState');
    if (savedState) {
        currentState = JSON.parse(savedState);
    }
}

// Save State to localStorage
function saveState() {
    localStorage.setItem('sbiForumState', JSON.stringify(currentState));
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.footer-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const screen = icon.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Search functionality
    elements.searchBtn.addEventListener('click', () => showScreen('searchScreen'));
    elements.searchBackBtn.addEventListener('click', () => showScreen('feedScreen'));
    elements.searchInput.addEventListener('input', performSearch);

    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Profile Creation
    elements.saveProfileBtn.addEventListener('click', saveProfile);

    // Post Creation
    elements.createPostBtn.addEventListener('click', () => showScreen('createPostScreen'));
    elements.publishPostBtn.addEventListener('click', publishPost);

    // Media Uploads
    document.getElementById('insertImageBtn').addEventListener('click', () => document.getElementById('imageInput').click());
    document.getElementById('insertVideoBtn').addEventListener('click', () => document.getElementById('videoInput').click());
    document.getElementById('insertAudioBtn').addEventListener('click', () => document.getElementById('audioInput').click());

    document.getElementById('imageInput').addEventListener('change', handleMediaUpload);
    document.getElementById('videoInput').addEventListener('change', handleMediaUpload);
    document.getElementById('audioInput').addEventListener('change', handleMediaUpload);

    // Chat
    elements.sendMessageBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Editor Toolbar
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.execCommand(btn.getAttribute('data-command'), false, null);
            elements.postEditor.focus();
        });
    });
}

// Show Screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenName).classList.add('active');
    
    document.querySelectorAll('.footer-icon').forEach(icon => {
        icon.classList.remove('active');
    });
    
    if (screenName !== 'createPostScreen' && screenName !== 'searchScreen') {
        const activeIcon = document.querySelector(`[data-screen="${screenName}"]`);
        if (activeIcon) {
            activeIcon.classList.add('active');
        }
    }
    
    currentState.currentScreen = screenName;
    saveState();
}

// Toggle Theme
function toggleTheme() {
    currentState.theme = currentState.theme === 'light' ? 'dark' : 'light';
    updateTheme();
    saveState();
}

// Update Theme
function updateTheme() {
    if (currentState.theme === 'dark') {
        document.body.classList.add('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Save Profile
function saveProfile() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Veuillez entrer un pseudo');
        return;
    }

    currentState.currentUser = {
        id: Date.now(),
        username: username,
        profilePic: elements.profilePreview.src,
        coverPic: elements.coverPreview.src
    };

    elements.headerProfilePic.src = elements.profilePreview.src;
    saveState();
    showScreen('feedScreen');
}

// Handle Media Upload
function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 500MB)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const mediaId = Date.now();
        const mediaElement = document.createElement('div');
        mediaElement.className = 'media-item';
        mediaElement.innerHTML = `
            <button class="remove-media" onclick="removeMedia(${mediaId})">×</button>
        `;

        if (file.type.startsWith('image/')) {
            mediaElement.innerHTML = `<img src="${event.target.result}" alt="Preview">` + mediaElement.innerHTML;
        } else if (file.type.startsWith('video/')) {
            mediaElement.innerHTML = `<video src="${event.target.result}" controls></video>` + mediaElement.innerHTML;
        } else if (file.type.startsWith('audio/')) {
            mediaElement.innerHTML = `<audio src="${event.target.result}" controls style="width: 80px;"></audio>` + mediaElement.innerHTML;
        }

        mediaElement.dataset.mediaId = mediaId;
        mediaElement.dataset.mediaSrc = event.target.result;
        mediaElement.dataset.mediaType = file.type;

        elements.mediaPreview.appendChild(mediaElement);
    };
    reader.readAsDataURL(file);
}

// Remove Media
function removeMedia(mediaId) {
    const mediaElement = document.querySelector(`[data-media-id="${mediaId}"]`);
    if (mediaElement) {
        mediaElement.remove();
    }
}

// Publish Post
function publishPost() {
    if (!currentState.currentUser) {
        alert('Veuillez créer un profil avant de publier');
        showScreen('profileScreen');
        return;
    }

    const content = elements.postEditor.innerHTML.trim();
    if (!content) {
        alert('Veuillez écrire du contenu');
        return;
    }

    const mediaItems = [];
    document.querySelectorAll('.media-item').forEach(item => {
        mediaItems.push({
            src: item.dataset.mediaSrc,
            type: item.dataset.mediaType
        });
    });

    const post = {
        id: Date.now(),
        userId: currentState.currentUser.id,
        username: currentState.currentUser.username,
        profilePic: currentState.currentUser.profilePic,
        content: content,
        media: mediaItems,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: []
    };

    currentState.posts.unshift(post);
    saveState();
    renderPosts();
    elements.postEditor.innerHTML = '';
    elements.mediaPreview.innerHTML = '';
    showScreen('feedScreen');
}

// Render Posts
function renderPosts() {
    if (!elements.postsContainer) return;

    elements.postsContainer.innerHTML = currentState.posts.map(post => `
        <div class="post">
            <div class="post-header">
                <img class="post-avatar" src="${post.profilePic}" alt="${post.username}">
                <div class="post-user-info">
                    <div class="post-username">${post.username}</div>
                    <div class="post-date">${new Date(post.timestamp).toLocaleDateString()}</div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.media.map(media => {
                if (media.type.startsWith('image/')) {
                    return `<img src="${media.src}" alt="Post image">`;
                } else if (media.type.startsWith('video/')) {
                    return `<video src="${media.src}" controls></video>`;
                } else if (media.type.startsWith('audio/')) {
                    return `<audio src="${media.src}" controls></audio>`;
                }
                return '';
            }).join('')}
            <div class="post-actions">
                <button class="action-btn">
                    <i class="fas fa-heart"></i> ${post.likes}
                </button>
                <button class="action-btn">
                    <i class="fas fa-comment"></i> ${post.comments.length}
                </button>
                <button class="action-btn">
                    <i class="fas fa-share"></i> Partager
                </button>
            </div>
            <div class="comments-section">
                ${post.comments.map(comment => `
                    <div class="comment">
                        <img class="comment-avatar" src="${comment.profilePic}" alt="${comment.username}">
                        <div class="comment-header">
                            <strong>${comment.username}</strong>
                            <span style="margin-left: 8px; font-size: 12px; color: var(--gray);">${new Date(comment.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div>${comment.content}</div>
                    </div>
                `).join('')}
                <div class="comment-form">
                    <input type="text" class="comment-input" placeholder="Écrire un commentaire...">
                    <button class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Perform Search
function performSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        elements.searchResults.innerHTML = '<p class="search-placeholder">Entrez un terme de recherche pour commencer</p>';
        return;
    }

    const results = currentState.posts.filter(post => 
        post.content.toLowerCase().includes(searchTerm) ||
        post.username.toLowerCase().includes(searchTerm)
    );

    if (results.length === 0) {
        elements.searchResults.innerHTML = '<p class="search-placeholder">Aucun résultat trouvé</p>';
        return;
    }

    elements.searchResults.innerHTML = results.map(post => `
        <div class="search-result-item" onclick="showPostFromSearch(${post.id})">
            <div class="search-result-title">${post.username}</div>
            <div class="search-result-preview">${post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</div>
        </div>
    `).join('');
}

// Show Post from Search
function showPostFromSearch(postId) {
    // In a real app, this would navigate to the specific post
    showScreen('feedScreen');
}

// Send Message
function sendMessage() {
    const content = elements.messageInput.value.trim();
    if (!content) return;

    if (!currentState.currentUser) {
        alert('Veuillez créer un profil avant d\'envoyer des messages');
        showScreen('profileScreen');
        return;
    }

    const message = {
        id: Date.now(),
        userId: currentState.currentUser.id,
        username: currentState.currentUser.username,
        content: content,
        timestamp: new Date().toISOString(),
        isSent: true
    };

    currentState.messages.push(message);
    saveState();
    renderMessages();
    elements.messageInput.value = '';
}

// Render Messages
function renderMessages() {
    if (!elements.chatMessages) return;

    elements.chatMessages.innerHTML = currentState.messages.map(message => `
        <div class="message ${message.isSent ? 'sent' : 'received'}">
            <div class="message-bubble">${message.content}</div>
        </div>
    `).join('');

    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
