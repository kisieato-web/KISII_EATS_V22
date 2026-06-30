import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

function getFriendlyAuthErrorMessage(error: { message?: string } | null) {
  if (!error) return null

  const message = error.message?.toLowerCase() ?? ''

  if (
    message.includes('database error saving new user') ||
    message.includes('user already registered') ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('email already')
  ) {
    return 'An account with this email already exists. Please sign in instead.'
  }

  if (message.includes('password') && message.includes('least')) {
    return 'Password must be at least 6 characters.'
  }

  return error.message
}

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null)
  const [role, setRoleState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const resolveRoleForUser = async (authUser: User | null, fallbackRole?: string | null) => {
    if (!authUser) {
      setRoleState(null)
      return null
    }

    const metaRole = authUser.user_metadata?.role as string | undefined
    if (metaRole) {
      setRoleState(metaRole)
      return metaRole
    }

    if (fallbackRole) {
      setRoleState(fallbackRole)
      return fallbackRole
    }

    for (let i = 0; i < 5; i++) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle()

      const dbRole = profile?.role as string | undefined
      if (dbRole) {
        setRoleState(dbRole)
        return dbRole
      }

      await new Promise(resolve => setTimeout(resolve, 800))
    }

    setRoleState(null)
    return null
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      const authUser = session?.user ?? null
      setUserState(authUser)
      await resolveRoleForUser(authUser)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      const authUser = s?.user ?? null
      setUserState(authUser)
      if (!authUser) {
        setRoleState(null)
        setLoading(false)
        return
      }

      await resolveRoleForUser(authUser)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string, phone: string, role: string = 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, role } }
    })

    const friendlyErrorMessage = getFriendlyAuthErrorMessage(error)
    if (friendlyErrorMessage && error) {
      return {
        error: new Error(friendlyErrorMessage),
        user: null,
        role: null,
        session: null
      }
    }

    const authUser = data?.session?.user ?? data?.user ?? null
    if (authUser && !error) {
      await resolveRoleForUser(authUser, role)

      const profilePayload = {
        id: authUser.id,
        email: authUser.email ?? email,
        full_name: name,
        phone,
        role
      }

      const { error: profileError } = await supabase
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' })

      if (profileError) {
        console.warn('Profile sync failed during signup:', profileError)
      }

      setUserState(authUser)
    }

    return {
      error,
      user: authUser,
      role: (authUser?.user_metadata?.role as string | undefined) || role,
      session: data?.session ?? null
    }
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

  const getRolePath = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin/dashboard'
      case 'restaurant_admin': return '/restaurant/dashboard'
      case 'rider': return '/rider/dashboard'
      default: return '/dashboard'
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      const friendlyErrorMessage = getFriendlyAuthErrorMessage(error)
      setUserState(null)
      return { error: friendlyErrorMessage ? new Error(friendlyErrorMessage) : error, role: null }
    }

    setUserState(data.user)

    const resolvedRole = await resolveRoleForUser(data.user)
    if (resolvedRole) {
      return { error: null, role: resolvedRole }
    }

    return { error: null, role: 'customer' }
  }

  const getDashboardPath = async (): Promise<string> => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return '/login'

    // Query users table first
    for (let i = 0; i < 3; i++) {
      const { data: p } = await supabase.from('users').select('role').eq('id', u.id).maybeSingle()
      if (p?.role) return getRolePath(p.role)
      await new Promise(r => setTimeout(r, 600))
    }

    // Fallback to metadata
    const metaRole = u.user_metadata?.role as string | undefined
    return getRolePath(metaRole || 'customer')
  }

  const signOut = async () => {
    setUserState(null)
    setRoleState(null)
    return supabase.auth.signOut()
  }

  return { user, role, loading, signUp, signUpAsRider, signUpAsRestaurant, signIn, signOut, getDashboardPath }
}
