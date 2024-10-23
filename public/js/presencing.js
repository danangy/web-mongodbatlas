function showNotification(message) {
    Swal.fire({
        icon: 'success',
        title: 'Absensi Berhasil',
        text: message,
        customClass: {
            confirmButton: 'custom-confirm-button'
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
    });
}


function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Gagal Absensi',
        text: message + "  Gunakan Jaringan Kantor",
        customClass: {
            confirmButton: 'custom-confirm-button'
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
    });
}

 function showErrorsession(message) {
    Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Aplikasi',
        text: 'Silahkan login kembali',
        footer: '<a href="index.html">Login now</a>',
        allowOutsideClick: false, 
        allowEscapeKey: false, 
        allowEnterKey: false, 
        showConfirmButton: false,
    });
}
// function formatDateTime(date) {
//     const options = {
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric'
//     };
//     return date.toLocaleString('id-ID', options); 
// }

async function formatDateTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Jakarta');
        const data = await response.json();

        // Mengambil waktu dari API dalam format ISO dan mengubah ke objek Date
        const dateTime = new Date(data.datetime);
        
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        // Mengembalikan waktu dalam format string yang diformat sesuai 'id-ID'
        return dateTime.toLocaleString('id-ID', options); 
    } catch (error) {
        console.error('Error fetching time:', error);
        return null;
    }
}


window.onload = function() {
    fetch('/user-session')  
        .then(response => {
            if (!response.ok) {
                showErrorsession('Silahkan login kembali'); 
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('display-nama').textContent = data.nama;
            document.getElementById('display-jabatan').textContent = data.jabatan;
        })
        .catch(error => {
            showErrorsession('Error loading session data.');
        });
};


async function formatDateTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Jakarta');
        const data = await response.json();

        // Mengambil waktu dari API dalam format ISO dan mengubah ke objek Date
        const dateTime = new Date(data.datetime);
        
        // Pisahkan tanggal dan waktu
        const tanggal = dateTime.toLocaleDateString('id-ID'); // Mengambil hanya tanggal
        const waktu = dateTime.toLocaleTimeString('id-ID');   // Mengambil hanya waktu

        // Mengembalikan objek dengan tanggal dan waktu terpisah
        return { tanggal, waktu };
    } catch (error) {
        console.error('Error fetching time:', error);
        return null;
    }
}


// Event listener untuk form absensi
document.getElementById('absensi-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nama = document.getElementById('display-nama').textContent;
    const jabatan = document.getElementById('display-jabatan').textContent;
    const absenType = document.getElementById('absenType').value;

    // Tunggu hasil dari fungsi formatDateTime (karena ini adalah Promise)
    const dateTime = await formatDateTime();  

    if (dateTime) {
        const { tanggal, waktu } = dateTime; // Pisahkan tanggal dan waktu dari hasil API

        console.log("Tanggal:", tanggal); // Tambahkan log ini untuk memastikan tanggal terbaca
        console.log("Waktu:", waktu);

        // Kirim data absensi ke server
        fetch('/submit-absensi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nama, jabatan, tanggal, waktu, absenType }) // Pastikan tanggal juga dikirim
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal menyimpan absensi. Silahkan coba lagi.');
            }
            return response.json();
        })
        .then(data => {
            showNotification(data.message);
        })
        .catch(error => {
            showError(error.message);
        });
    } else {
        showError('Gagal mendapatkan waktu dari server.');
    }
});



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