import { supabase } from './supabase/client'

// Development authentication helper that bypasses email confirmation
export const devAuth = {
  // Create a test user that works in development
  createDevUser: async (email: string, password: string, name: string) => {
    try {
      // For development, we'll use a simple approach
      // First, try to sign up normally
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (error) {
        // If there's an error, it might be because the user already exists
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          throw new Error('Unable to create or sign in user. Please try a different email.')
        }
        
        return { success: true, user: signInData.user, session: signInData.session }
      }
      
      // If signup was successful but email confirmation is required
      if (data.user && !data.session) {
        // In development, we'll show a message about email confirmation
        throw new Error('Account created! Please check your email for confirmation. In development, you may need to manually confirm the email in the Supabase dashboard.')
      }
      
      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Dev user creation error:', error)
      throw error
    }
  },

  // Sign in with existing credentials
  signInDevUser: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Dev user sign in error:', error)
      throw error
    }
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }
}
