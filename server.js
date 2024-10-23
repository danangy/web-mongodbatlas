require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const axios = require('axios');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const wifi = require('node-wifi');
const session = require('express-session');
const port = 3000;
const app = express();


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((error) => {
    console.error('Error connecting to MongoDB Atlas', error);
});


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    securityQuestion: String,
    securityAnswer: String,
    name: String,
    position: String
});

const attendanceSchema = new mongoose.Schema({
    name: String,
    position: String,
    date: String,
    absenType: String
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);


app.use(session({
  secret: process.env.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 
  }
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/index.html');
  }
}

function checkAuthpro(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.send(`
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </head>
        <body>
          <script>
            Swal.fire({
              icon: 'error',
              title: 'Gagal Memuat Aplikasi',
              text: 'Silahkan login kembali',
              footer: '<a href="index.html">Login Sekarang</a>',
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
              showConfirmButton: false
            }).then(() => {
              window.location.href = '/index.html';
            });
          </script>
        </body>
      </html>
    `);
  }
}


function verifyAbsensiSession(req, res, next) {
    if (req.session && req.session.username && req.session.jabatan) {
        next();
    } else {
        res.status(403).json({ message: 'Unauthorized: No session data' });
    }
}
app.get('/home.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});


app.get('/profil.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profil.html'));
});


wifi.init({
  iface: null
});

async function getConnectedSsid() {
  try {
    const networks = await wifi.scan();
    const currentNetwork = networks.find(net => net.ssid);
    if (currentNetwork) {
      return currentNetwork.ssid;
    } else {
      return 'No connected network found';
    }
  } catch (error) {
    console.error('Error fetching Wi-Fi networks:', error);
    return null;
  }
}


const ALLOWED_SSID = ['Office', 'office_wifi', 'backup_network']; 

async function verifySsid(req, res, next) {
  try {
    const { absenType } = req.body;
    const ssid = await getConnectedSsid(); 

    if (absenType === 'kantor') {
      const networks = await wifi.scan();
      const connectedNetwork = networks.find(net => ALLOWED_SSID.includes(net.ssid)); 
      if (connectedNetwork && ALLOWED_SSID.includes(ssid)) {
        console.log('Absen dari kantor dengan SSID:', ssid);
        return next(); 
      } else {
        console.error('SSID tidak diizinkan. Current SSID:', ssid);
        return res.status(403).json({ message: 'Kamu Harus Menggunakan Jaringan Kantor' });
      }
    } else {
      console.log('Absen dari rumah dengan SSID:', ssid);
      return next();
    }
  } catch (error) {
    console.error('Error dalam memverifikasi SSID:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}


app.post('/submit-absensi', verifySsid, verifyAbsensiSession, (req, res) => {
  const { nama, jabatan, tanggal, waktu, absenType } = req.body;

  // Tambahkan log untuk memverifikasi apakah tanggal diterima dengan benar
  console.log("Tanggal dari client:", tanggal);
  console.log("Waktu dari client:", waktu);

  const absensi = new Attendance({
      name: nama,
      position: jabatan,
      date: tanggal,   // Simpan tanggal saja
      time: waktu,     // Simpan waktu saja
      absenType
  });

  // Simpan ke MongoDB dan kirim ke Google Spreadsheet
  absensi.save()
      .then(() => {
          // Kirim data ke Google Sheets dengan tanggal dan waktu terpisah
          axios.post(process.env.GOOGLE_APPS_SCRIPT_URL_ABSEN, {
              nama: nama,
              jabatan: jabatan,
              tanggal: tanggal,  // Kirim tanggal terpisah
              waktu: waktu,      // Kirim waktu terpisah
              absenType: absenType
          })
          .then(response => {
              console.log('Absensi berhasil disimpan ke Google Sheets:', response.data);
              res.json({ message: 'Absensi berhasil dicatat' });
          })
          .catch(error => {
              console.error('Error saving absensi to Google Sheets:', error);
              res.status(500).json({ message: 'Failed to record absensi in Google Sheets' });
          });
      })
      .catch(error => {
          console.error('Error saving absensi:', error);
          res.status(500).json({ message: 'Failed to record absensi' });
      });
});




app.get('/profile', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      username: user.username,
      name: user.name,
      position: user.position
    });
  } catch (err) {
    console.error('Error finding user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update profile
app.post('/update-profile', checkAuth, (req, res) => {
    const { name, position } = req.body;

    User.findByIdAndUpdate(req.session.userId, { name, position }, { new: true })
        .then(() => {
            req.session.nama = name;
            req.session.jabatan = position;
            res.status(200).json({ message: 'Profile updated successfully' });
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Failed to update profile' });
        });
});
// Register user
app.post('/register', async (req, res) => {
  const { username, password, securityQuestion, securityAnswer } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer,
      name: '',
      position: ''
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
     
      if (!username || !password) {
          return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = await User.findOne({ username });
      if (!user) {
          return res.status(400).json({ message: 'User not found' });
      }

      if (!user.password) {
          return res.status(500).json({ message: 'Password hash missing in database' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid password' });
      }

      
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.nama = user.name;
      req.session.jabatan = user.position;

      
      if (username === 'admin') {
          res.status(200).json({
              message: 'Login successful',
              redirect: '/admin.html' 
          });
      } else if (username === 'superuser') {
          res.status(200).json({
              message: 'Login successful',
              redirect: '/superuser.html' 
          });
      } else {
          res.status(200).json({
              message: 'Login successful',
              redirect: '/home'
          });
      }
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/user-session', (req, res) => {
    if (req.session.username && req.session.nama && req.session.jabatan) {
        res.json({
            username: req.session.username,
            nama: req.session.nama,
            jabatan: req.session.jabatan
        });
    } else {
        res.status(401).json({ message: 'User not logged in' });
    }
});

// Get data absensi
app.get('/data-absensi', checkAdmin, async (req, res) => {
  try {
    const attendanceData = await Attendance.find({});
    res.json(attendanceData);
  } catch (err) {
    console.error('Error fetching absensi data:', err);
    res.status(500).json({ message: 'Failed to read absensi data' });
  }
});

function checkSuperuser(req, res, next) {
  if (req.session.username === 'superuser') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Superuser access required' });
  }
}


function checkAdmin(req, res, next) {
  if (req.session.username === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Superuser access required' });
  }
}

// Logout user
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/index.html');
  });
});


app.post('/forgot-password', async (req, res) => {
  const { username, securityAnswer, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isAnswerMatch = await bcrypt.compare(securityAnswer, user.securityAnswer);
    if (!isAnswerMatch) {
      return res.status(400).json({ message: 'Incorrect security answer' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error during password update:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/home', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html')); 
});

app.get('/training', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'training.html'));  
});

app.get('/logins-consultation-office', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'logins-consultation-office.html'));  
});

app.get('/report-daily', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'report-daily.html'));  
});

app.get('/rd', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'rd.html')); 
});

app.get('/sales-tools-resources', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sales-tools-resources.html')); 
});

app.get('/social-media-marketing-newsletter-management', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'social-media-marketing-newsletter-management.html'));  
});

app.get('/material-specifications-and-catalogues', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'material-specifications-and-catalogues.html')); 
});

app.get('/supplier-price-list', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'supplier-price-list.html'));  
});

app.get('/complain-sugestions', checkAuthpro, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'complain-sugestions.html'));  
});

app.get('/admin.html', checkAuth, checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// Route to add a new user (superuser access only)
app.post('/users', checkSuperuser, async (req, res) => {
  const { username, password, position } = req.body;

  try {
   
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      position,
    });

    await newUser.save();
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get the list of users (superuser access only)
app.get('/users', checkSuperuser, async (req, res) => {
  try {
    const users = await User.find({}, 'username position'); 
    res.status(200).json(users); 
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

// Route to update an existing user (superuser access only)
app.put('/users/:id', checkSuperuser, async (req, res) => {
  const { username, password, position } = req.body;
  const userId = req.params.id;

  try {
    const updateData = { username, position };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10); 
    }

    await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Route to delete an existing user (superuser access only)
app.delete('/users/:id', checkSuperuser, async (req, res) => {
  const userId = req.params.id;

  try {
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
