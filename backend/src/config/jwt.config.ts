export default () => {
  console.log(
    'JWT_SECRET_KEY:',
    process.env.JWT_SECRET_KEY ? '***SET***' : 'UNDEFINED',
  );
  console.log(
    'All env keys:',
    Object.keys(process.env).filter((k) => k.includes('JWT')),
  );
  return {
    jwt: {
      secret: process.env.JWT_SECRET_KEY,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
  };
};
