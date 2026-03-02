export default () => ({
    jwt: {
        secret: process.env.JWT_SECET_KEY,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
}); 