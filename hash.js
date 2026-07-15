const bcrypt = require('bcrypt');

// Replace 'your_secure_password_here' with your actual desired password
bcrypt.hash('Avnish@561959', 10).then(hash => {
  console.log('\nCopy the hash below and paste it into your .env file:\n');
  console.log(hash);
  console.log('\n');
});