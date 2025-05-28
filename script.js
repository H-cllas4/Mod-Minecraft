// Konfigurasi Firebase (Ganti dengan konfigurasi Anda)
const firebaseConfig = {
    apiKey: "AIzaSyAFpbU8sDw0n9Fk_KIRN57DWhUJLfMJ70Y",
    authDomain: "link-manager-minecraft.firebaseapp.com",
    databaseURL: "https://console.firebase.google.com/u/0/project/link-manager-minecraft/database/link-manager-minecraft-default-rtdb/data/~2F",
    projectId: "link-manager-minecraft",
    storageBucket: "link-manager-minecraft.firebasestorage.app",
    messagingSenderId: "664451008583",
    appId: "1:664451008583:web:f0f3fe6d33e7b559b1c962"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referensi ke database
const linksRef = database.ref('links');

// DOM Elements
const linkList = document.getElementById('linkList');
const addBtn = document.getElementById('addBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const linkTitle = document.getElementById('linkTitle');
const linkUrl = document.getElementById('linkUrl');
const linkDescription = document.getElementById('linkDescription');

// Tambahkan link baru
addBtn.addEventListener('click', () => {
    const title = linkTitle.value.trim();
    const url = linkUrl.value.trim();
    const description = linkDescription.value.trim();
    
    if (!title || !url) {
        alert('Judul dan URL harus diisi!');
        return;
    }
    
    // Validasi URL
    try {
        new URL(url);
    } catch (e) {
        alert('Masukkan URL yang valid (contoh: https://example.com)');
        return;
    }
    
    // Push data ke Firebase
    const newLinkRef = linksRef.push();
    newLinkRef.set({
        title,
        url,
        description,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Reset form
    linkTitle.value = '';
    linkUrl.value = '';
    linkDescription.value = '';
});

// Cari link
searchBtn.addEventListener('click', searchLinks);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLinks();
});

function searchLinks() {
    const searchTerm = searchInput.value.toLowerCase();
    linksRef.once('value', (snapshot) => {
        const links = [];
        snapshot.forEach((childSnapshot) => {
            const link = childSnapshot.val();
            link.id = childSnapshot.key;
            links.push(link);
        });
        
        const filteredLinks = searchTerm 
            ? links.filter(link => 
                link.title.toLowerCase().includes(searchTerm) || 
                link.description.toLowerCase().includes(searchTerm) ||
                link.url.toLowerCase().includes(searchTerm))
            : links;
        
        displayLinks(filteredLinks);
    });
}

// Tampilkan link
function displayLinks(links) {
    if (links.length === 0) {
        linkList.innerHTML = '<div class="no-links">Tidak ada link yang ditemukan</div>';
        return;
    }
    
    // Urutkan berdasarkan tanggal terbaru
    links.sort((a, b) => b.createdAt - a.createdAt);
    
    linkList.innerHTML = '';
    links.forEach(link => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <div class="link-title">${link.title}</div>
            <a href="${link.url}" target="_blank" class="link-url">${link.url}</a>
            ${link.description ? `<div class="link-description">${link.description}</div>` : ''}
            <div class="link-actions">
                <button class="edit-btn" data-id="${link.id}">Edit</button>
                <button class="delete-btn" data-id="${link.id}">Hapus</button>
            </div>
        `;
        linkList.appendChild(linkItem);
    });
    
    // Tambahkan event listener untuk tombol hapus dan edit
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteLink(id);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editLink(id);
        });
    });
}

// Hapus link
function deleteLink(id) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini?')) {
        linksRef.child(id).remove();
    }
}

// Edit link
function editLink(id) {
    linksRef.child(id).once('value', (snapshot) => {
        const link = snapshot.val();
        
        linkTitle.value = link.title;
        linkUrl.value = link.url;
        linkDescription.value = link.description || '';
        
        // Scroll ke form
        document.querySelector('.add-link-form').scrollIntoView();
        
        // Ganti tombol simpan menjadi update
        addBtn.textContent = 'Update Link';
        addBtn.onclick = function() {
            updateLink(id);
        };
    });
}

function updateLink(id) {
    const title = linkTitle.value.trim();
    const url = linkUrl.value.trim();
    const description = linkDescription.value.trim();
    
    if (!title || !url) {
        alert('Judul dan URL harus diisi!');
        return;
    }
    
    linksRef.child(id).update({
        title,
        url,
        description,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Reset form
    linkTitle.value = '';
    linkUrl.value = '';
    linkDescription.value = '';
    addBtn.textContent = 'Simpan Link';
    addBtn.onclick = function() {
        addBtn.click();
    };
}

// Load semua link saat pertama kali
linksRef.on('value', (snapshot) => {
    const links = [];
    snapshot.forEach((childSnapshot) => {
        const link = childSnapshot.val();
        link.id = childSnapshot.key;
        links.push(link);
    });
    displayLinks(links);
});