import authReducer, { logout, setAuth } from './authSlice';
import { fetchMeThunk, logoutThunk, loginThunk } from './authThunk';

const user = { id: 1, email: 'jane@example.com', userName: 'Jane', role: 'customer' };

const initialState = {
  signupLoading: false,
  loginLoading: false,
  verifyEmailLoading: false,
  meLoading: false,
  user: null,
  isAuthenticated: false,
  authChecked: false,
  sendOtpLoading: false,
  verifyOtpLoading: false,
  resetPasswordLoading: false,
};

describe('authSlice', () => {
  it('has authChecked false in the initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.authChecked).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  describe('fetchMeThunk (session hydration)', () => {
    it('sets meLoading on pending', () => {
      const state = authReducer(initialState, fetchMeThunk.pending('', undefined));
      expect(state.meLoading).toBe(true);
    });

    it('stores the user and marks authChecked on fulfilled', () => {
      const state = authReducer(
        initialState,
        fetchMeThunk.fulfilled(user, '', undefined),
      );
      expect(state.meLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.authChecked).toBe(true);
    });

    it('clears auth and marks authChecked on rejected', () => {
      const authed = { ...initialState, isAuthenticated: true, user };
      const state = authReducer(
        authed,
        fetchMeThunk.rejected(new Error('Unauthorized'), '', undefined),
      );
      expect(state.meLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.authChecked).toBe(true);
    });
  });

  describe('logoutThunk', () => {
    it('resets auth state on fulfilled', () => {
      const authed = { ...initialState, isAuthenticated: true, user, authChecked: true };
      const state = authReducer(authed, logoutThunk.fulfilled(true, '', undefined));
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('loginThunk', () => {
    it('sets user and isAuthenticated on fulfilled', () => {
      const payload = { message: 'Login successful', user };
      const state = authReducer(
        initialState,
        loginThunk.fulfilled(payload, '', { email: 'jane@example.com', password: 'x' }),
      );
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.loginLoading).toBe(false);
    });
  });

  describe('synchronous reducers (kept for backward compat)', () => {
    it('setAuth sets the user', () => {
      const state = authReducer(initialState, setAuth({ user }));
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
    });

    it('logout clears the user', () => {
      const authed = { ...initialState, isAuthenticated: true, user };
      const state = authReducer(authed, logout());
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
