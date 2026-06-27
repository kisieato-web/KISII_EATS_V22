import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const getRoleFromDB = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    console.log('========== ROLE LOOKUP ==========');
    console.log('User ID:', userId);
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('===============================');

    if (error) {
      console.error('Role lookup failed:', error);
    }

    return data?.role || 'customer';
  };

  const updateProfile = async (
    userId: string,
    name: string,
    phone: string
  ) => {
    const formatted = phone
      ? phone.startsWith('254')
        ? phone
        : `254${phone.replace(/^0+/, '')}`
      : null;

    await supabase
      .from('users')
      .update({
        full_name: name,
        ...(formatted ? { phone: formatted } : {}),
      })
      .eq('id', userId);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role: 'customer',
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return {
          error: new Error(
            'An account with this email already exists. Please sign in.'
          ),
          user: null,
          role: null,
        };
      }

      return { error, user: null, role: null };
    }

    const authUser = data.user ?? null;

    if (!authUser) {
      return {
        error: new Error('Signup failed.'),
        user: null,
        role: null,
      };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateProfile(authUser.id, name, phone);

    const role = await getRoleFromDB(authUser.id);

    return {
      error: null,
      user: authUser,
      role,
    };
  };

  const signUpAsRider = async (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role: 'rider',
        },
      },
    });

    return { error };
  };

  const signUpAsRestaurant = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    restaurantName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          role: 'restaurant_admin',
          restaurant_name: restaurantName,
        },
      },
    });

    if (data?.user) {
      await supabase.from('restaurants').insert({
        owner_id: data.user.id,
        name: restaurantName,
        phone,
        address: '',
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return { error, user: null, role: null };
    }

    const authUser = data.user ?? null;

    console.log('Signed in user:', authUser);

    const role = authUser
      ? await getRoleFromDB(authUser.id)
      : 'customer';

    console.log('Final role:', role);

    return {
      error: null,
      user: authUser,
      role,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    signUp,
    signUpAsRider,
    signUpAsRestaurant,
    signIn,
    signOut,
  };
}