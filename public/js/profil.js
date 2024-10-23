function loadProfile() {
    fetch('/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('display-username').textContent = data.username;
            document.getElementById('name').value = data.name || '';
            document.getElementById('position').value = data.position || '';
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
            icon: 'error',
            title: 'Gagal Memuat Aplikasi',
            text: 'Silahkan login kembali',
            footer: '<a href="index.html">Login now</a>',
            allowOutsideClick: false, 
            allowEscapeKey: false, 
            allowEnterKey: false, 
            showConfirmButton: false,
            // showCloseButton: true // Optional: Show a close button (X) in the top-right corner
        });
        });
}

// Handle profile form submission
document.getElementById('profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const position = document.getElementById('position').value;

    fetch('/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, position })
    })
    .then(response => {
        console.log("Raw response:", response); 

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        return response.json();
    })
    .then(data => {
        console.log("Parsed response data:", data); 
        Swal.fire({
            icon: 'success',
            title: 'Profil Terupdate',
            text: `${data.message}. Anda akan keluar sekarang, silahkan login kembali.`
        }).then(() => {
            // Trigger the logout
            fetch('/logout')
                .then(() => {
                    window.location.href = '/index.html';
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Logout Gagal',
                        text: 'Logout gagal dilakukan'
                    });
                });
        });
    })
    .catch(error => {
        console.error('Error:', error); 
        Swal.fire({
            icon: 'error',
            title: 'Gagal Mengupdate Profil',
            text: 'Gagal mengupdate profil',
        });
    });
});

// Handle logout
document.getElementById('logout').addEventListener('click', function() {
    fetch('/logout')
        .then(() => {
            window.location.href = '/index.html';
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Logout Gagal',
                text: 'Logout gagal dilakukan'
            });
        });
});


window.onload = loadProfile;

function toggleNav() {
    var sidebar = document.getElementById("mySidebar");
    var topbar = document.getElementById("topbar");
    var openbtn = document.querySelector(".openbtn");
    var openbtnonsidebar = document.querySelector(".openbtnonsidebar");

    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
        topbar.classList.remove("hidden-topbar");
        openbtn.style.display = "block";
        openbtnonsidebar.style.display = "none";
    } else {
        sidebar.style.width = "250px";
        topbar.classList.add("hidden-topbar");
        openbtn.style.display = "none";
        openbtnonsidebar.style.display = "block";
    }
}

function toggleSearchBar() {
    var searchBar = document.getElementById("searchBar");
    searchBar.classList.toggle("hidden");
}

window.onscroll = function() {
    const topbar = document.getElementById("topbar");
    const headerHeight = document.querySelector("header").offsetHeight;
    const searchIcon = document.querySelector(".search-icon img");

    if (window.pageYOffset > headerHeight) {
        topbar.style.backgroundColor = "white";
        topbar.style.color = "black";
        topbar.querySelectorAll(".title, .openbtn").forEach(function(element) {
            element.style.color = "black";
        });
        searchIcon.src = "https://img.icons8.com/000000/search.png";
    } else {
        topbar.style.backgroundColor = "rgba(0, 0, 0, 0)";
        topbar.style.color = "white";
        topbar.querySelectorAll(".title, .openbtn").forEach(function(element) {
            element.style.color = "white";
        });
        searchIcon.src = "https://img.icons8.com/ffffff/search.png";
    }
}