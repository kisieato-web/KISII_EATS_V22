import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { sendSMS } from '../lib/smartpay';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const formatPhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('0')) return '254' + cleaned.substring(1);
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '254' + cleaned;
    return cleaned;
  };

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // SIGNUP: Send OTP for verification
  const signUpWithOTP = async (phone: string, name: string) => {
    const formattedPhone = formatPhone(phone);
    const otp = generateOTP();

    localStorage.setItem(`otp_${formattedPhone}`, JSON.stringify({
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      name,
    }));

    const smsResult = await sendSMS(formattedPhone, `Welcome to Kisii Eats! Your verification code: ${otp}`);

    if (smsResult.status !== 'success') {
      localStorage.removeItem(`otp_${formattedPhone}`);
      return { error: new Error('Failed to send verification code') };
    }

    return { error: null };
  };

  // SIGNUP: Verify OTP and create account
  const verifySignUpOTP = async (phone: string, token: string, password: string) => {
    const formattedPhone = formatPhone(phone);
    const stored = localStorage.getItem(`otp_${formattedPhone}`);

    if (!stored) return { error: new Error('Code expired. Please sign up again.') };

    const { otp, expires, name } = JSON.parse(stored);
    if (Date.now() > expires) {
      localStorage.removeItem(`otp_${formattedPhone}`);
      return { error: new Error('Code expired. Please sign up again.') };
    }
    if (otp !== token) return { error: new Error('Invalid code.') };

    localStorage.removeItem(`otp_${formattedPhone}`);

    const email = `${formattedPhone}@kisiieats.com`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone: formattedPhone } },
    });

    if (error) return { error };

    // Supabase trigger handle_new_user() creates the public.users row automatically.
    return { error: null };
  };

  // LOGIN: Phone + password
  const signIn = async (phone: string, password: string) => {
    const formattedPhone = formatPhone(phone);
    const email = `${formattedPhone}@kisiieats.com`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: new Error('Invalid phone number or password.') };

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signUpWithOTP, verifySignUpOTP, signIn, signOut, formatPhone };
}
