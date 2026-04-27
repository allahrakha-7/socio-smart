import jwt from 'jsonwebtoken';

const generateToken = (userId, role) => {
  // Determine expiration time based on the enterprise security rules
  let expirationTime;

  switch (role) {
    case 'resident':
      expirationTime = '90d'; // Maximum convenience, relies on Admin DB kill-switch
      break;
    case 'admin':
      expirationTime = '30d';
      break;
    case 'guard':
      expirationTime = '12h'; // Maximum security, strictly expires after one shift
      break;
    default:
      expirationTime = '1d';  // Safe fallback
  }

  // Sign and return the token with the dynamic expiration
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: expirationTime }
  );
};

export default generateToken;
