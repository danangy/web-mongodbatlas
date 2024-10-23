document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  });

  document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  document.getElementById('show-forgot').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'block';
  });

  document.getElementById('show-login-from-forgot').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('forgot-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Login successful') {
     
        window.location.href = data.redirect;
      } else {
     
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.message,
          customClass: {
            confirmButton: 'custom-confirm-button' 
          },
          allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
        });
      }
    })
    .catch(error => {
      console.error('Error:', error); 
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        message: error,
        text: 'An error occurred during login',
        customClass: {
          confirmButton: 'custom-confirm-button' 
        },
        allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
      });
    });
  });

  document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const securityQuestion = document.getElementById('register-security-question').value;
    const securityAnswer = document.getElementById('register-security-answer').value;

    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, securityQuestion, securityAnswer }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Registration successful') {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: data.message,
          footer: '<a href="index.html">Login now</a>',
          customClass: {
            confirmButton: 'custom-confirm-button' // Add custom class
          },
          allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
        }).then(() => {
          document.getElementById('register-form').style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
        });
      } else {
        // If there is an error, show error message with SweetAlert2
        Swal.fire({
          icon: 'error',
          title: 'error registration',
          text: data.message,
          footer: '<a href="index.html">Login now</a>',
          customClass: {
            confirmButton: 'custom-confirm-button' 
          },
          allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
        });
      }
    })
    .catch(error => {
      console.error('Error:', error); 
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'An error occurred during registration',
        customClass: {
          confirmButton: 'custom-confirm-button' 
        },
        allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
      });
    });
  });

  document.getElementById('forgot-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('forgot-username').value;
    const securityAnswer = document.getElementById('forgot-security-answer').value;
    const newPassword = document.getElementById('forgot-new-password').value;

    fetch('/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, securityAnswer, newPassword }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Password reset successful') {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text: data.message,
          footer: '<a href="index.html">Login now</a>',
          customClass: {
            confirmButton: 'custom-confirm-button' 
          },
          allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
          
        }).then(() => {
          document.getElementById('forgot-form').style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Password Reset Failed',
          text: data.message,
          customClass: {
            confirmButton: 'custom-confirm-button' 
          },
          allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
        });
      }
    })
    .catch(error => {
      console.error('Error:', error); 
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'An error occurred during password reset',
        customClass: {
          confirmButton: 'custom-confirm-button' 
        },
        allowOutsideClick: false, 
          allowEscapeKey: false, 
          allowEnterKey: false, 
          // showConfirmButton: false,
      });
    });
  });