import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';
import { VALIDATION } from '../constants/supabase';
import { Profile } from '../types/database';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  session?: any;
}

/**
 * Authentication Service
 * Handles all authentication-related operations
 */
class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      console.log('AuthService: Starting signup for:', data.email);

      // Validate input
      this.validateSignUpData(data);
      console.log('AuthService: Validation passed');

      // Check if username is available
      const isAvailable = await this.checkUsernameAvailability(data.username);
      console.log('AuthService: Username availability:', isAvailable);

      if (!isAvailable) {
        return {
          success: false,
          message: 'Username is already taken',
        };
      }

      // Create auth user
      console.log('AuthService: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            display_name: data.displayName || data.username,
          },
        },
      });

      if (authError) {
        console.error('AuthService: Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.error('AuthService: No user returned from signup');
        return {
          success: false,
          message: 'Failed to create user account',
        };
      }

      console.log('AuthService: Auth user created:', authData.user.id);

      // Create profile
      console.log('AuthService: Creating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: data.username,
          display_name: data.displayName || data.username,
          email: data.email,
          age: data.age,
          gender: data.gender,
        });

      if (profileError) {
        console.error('AuthService: Profile creation error:', profileError);
        // Note: Cannot delete auth user from client - admin operations require service role
        // User may need manual cleanup if profile creation fails
        console.error('AuthService: Profile creation failed. User auth created but profile missing:', authData.user.id);
        throw new Error('Failed to create user profile. Please contact support if this persists.');
      }

      console.log('AuthService: Profile created successfully');

      // Create wallet for the user
      console.log('AuthService: Creating wallet...');
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: authData.user.id,
        });

      if (walletError) {
        console.error('AuthService: Failed to create wallet:', walletError);
        // Don't fail signup if wallet creation fails, can be created later
      } else {
        console.log('AuthService: Wallet created successfully');
      }

      console.log('AuthService: Signup completed successfully');
      return {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      console.error('AuthService: Signup error:', error);
      const errorMessage = handleSupabaseError(error);
      console.error('AuthService: Error message:', errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Update last login timestamp
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);
      }

      return {
        success: true,
        message: 'Login successful',
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get current user session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Verify OTP for email verification
   */
  async verifyOTP(email: string, token: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email verified successfully',
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Verification code sent to your email',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'mantra://reset-password',
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset link sent to your email',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      // Validate password
      if (newPassword.length < VALIDATION.MIN_PASSWORD_LENGTH) {
        return {
          success: false,
          message: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Change email
   */
  async changeEmail(newEmail: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Verification email sent to your new email address',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(): Promise<AuthResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      // Set deletion scheduled date (7 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'pending_deletion',
          deletion_scheduled_date: deletionDate.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sign out user
      await this.logout();

      return {
        success: true,
        message: 'Account deletion scheduled. You have 7 days to cancel.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Cancel account deletion
   */
  async cancelAccountDeletion(): Promise<AuthResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          deletion_scheduled_date: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      return {
        success: true,
        message: 'Account deletion cancelled',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      return !data; // Available if no data found
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Validate sign up data
   */
  private validateSignUpData(data: SignUpData): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Password validation
    if (data.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
    }

    // Check if password contains both letters and numbers
    const hasLetters = /[a-zA-Z]/.test(data.password);
    const hasNumbers = /[0-9]/.test(data.password);
    if (!hasLetters || !hasNumbers) {
      throw new Error('Password must contain both letters and numbers');
    }

    // Username validation
    if (data.username.length < VALIDATION.MIN_USERNAME_LENGTH) {
      throw new Error(`Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters`);
    }

    if (data.username.length > VALIDATION.MAX_USERNAME_LENGTH) {
      throw new Error(`Username must be less than ${VALIDATION.MAX_USERNAME_LENGTH} characters`);
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(data.username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Age validation
    if (data.age !== undefined) {
      if (data.age < VALIDATION.MIN_AGE || data.age > VALIDATION.MAX_AGE) {
        throw new Error(`Age must be between ${VALIDATION.MIN_AGE} and ${VALIDATION.MAX_AGE}`);
      }
    }
  }
}

export default new AuthService();
