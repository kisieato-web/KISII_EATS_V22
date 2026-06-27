import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string, phone: string, role: string = 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, role } }
    })
    return { error, user: data?.user || null }
  }

  const signUpAsRider = (email: string, password: string, name: string, phone: string) =>
    signUp(email, password, name, phone, 'rider')

  const signUpAsRestaurant = async (
    email: string, password: string, name: string, phone: string,
    restaurantName: string, address: string, description: string
  ) => {
    const { error, user } = await signUp(email, password, name, phone, 'restaurant_admin')
    if (user) {
      await supabase.from('restaurants').insert({
        owner_id: user.id,
        name: restaurantName,
        phone,
        address,
        description: description || null,
        status: 'pending'
      })
    }
    return { error, user }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const getRolePath = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin/dashboard'
      case 'restaurant_admin': return '/restaurant/dashboard'
      case 'rider': return '/rider/dashboard'
      default: return '/dashboard'
    }
  }

  const getDashboardPath = async (): Promise<string> => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return '/login'

    // 1. Try meta_data first — available instantly after signUp/signIn
    const metaRole = u.user_metadata?.role as string | undefined
    if (metaRole && metaRole !== 'customer') return getRolePath(metaRole)

    // 2. Retry users table up to 3 times (trigger may not have fired yet)
    for (let i = 0; i < 3; i++) {
      const { data: p } = await supabase.from('users').select('role').eq('id', u.id).maybeSingle()
      if (p?.role) return getRolePath(p.role)
      await new Promise(r => setTimeout(r, 600))
    }

    // 3. Fall back to meta_data role even if customer
    return getRolePath(metaRole || 'customer')
  }

  const signOut = async () => await supabase.auth.signOut()

  return { user, loading, signUp, signUpAsRider, signUpAsRestaurant, signIn, signOut, getDashboardPath }
}