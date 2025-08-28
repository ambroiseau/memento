import { supabase } from './supabase/client'

// Test authentication helper
export const testAuth = {
  // Create a test user account
  createTestUser: async (email: string, password: string, name: string) => {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (error) throw error
      
      // Create a profile for the user
      if (data.user) {
        await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            name: name
          })
      }
      
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Test user creation error:', error)
      throw error
    }
  },

  // Sign in with test credentials
  signInTestUser: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Test user sign in error:', error)
      throw error
    }
  }
}
