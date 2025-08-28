import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient } from '@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize storage bucket on startup
async function initStorage() {
  const bucketName = 'make-43af5861-family-photos'
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false })
    console.log('Created private storage bucket:', bucketName)
  }
}

// Create a new family space
app.post('/make-server-43af5861/families', async (c) => {
  try {
    const { name, createdBy } = await c.req.json()
    
    // Generate unique family code
    const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const family = {
      id: crypto.randomUUID(),
      code: familyCode,
      name: name,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      members: [createdBy]
    }
    
    await kv.set(`family:${familyCode}`, family)
    await kv.set(`user:${createdBy}:family`, familyCode)
    
    return c.json({ success: true, family })
  } catch (error) {
    console.log('Error creating family:', error)
    return c.json({ error: 'Failed to create family' }, 500)
  }
})

// Join a family with code
app.post('/make-server-43af5861/families/join', async (c) => {
  try {
    const { familyCode, userId } = await c.req.json()
    
    const family = await kv.get(`family:${familyCode.toUpperCase()}`)
    if (!family) {
      return c.json({ error: 'Invalid family code' }, 404)
    }
    
    // Add user to family members if not already a member
    if (!family.members.includes(userId)) {
      family.members.push(userId)
      await kv.set(`family:${familyCode.toUpperCase()}`, family)
    }
    
    // Set user's active family
    await kv.set(`user:${userId}:family`, familyCode.toUpperCase())
    
    return c.json({ success: true, family })
  } catch (error) {
    console.log('Error joining family:', error)
    return c.json({ error: 'Failed to join family' }, 500)
  }
})

// Get user's family
app.get('/make-server-43af5861/users/:userId/family', async (c) => {
  try {
    const userId = c.req.param('userId')
    const familyCode = await kv.get(`user:${userId}:family`)
    
    if (!familyCode) {
      return c.json({ family: null })
    }
    
    const family = await kv.get(`family:${familyCode}`)
    
    // Get member details
    if (family && family.members) {
      const membersWithDetails = []
      for (const memberId of family.members) {
        const member = await kv.get(`user:${memberId}`)
        if (member) {
          membersWithDetails.push({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar
          })
        }
      }
      family.members = membersWithDetails
    }
    
    return c.json({ family })
  } catch (error) {
    console.log('Error getting user family:', error)
    return c.json({ error: 'Failed to get family' }, 500)
  }
})

// Create user profile
app.post('/make-server-43af5861/users', async (c) => {
  try {
    const { id, name, email, avatar } = await c.req.json()
    
    const user = {
      id,
      name,
      email,
      avatar,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`user:${id}`, user)
    return c.json({ success: true, user })
  } catch (error) {
    console.log('Error creating user profile:', error)
    return c.json({ error: 'Failed to create user profile' }, 500)
  }
})

// Get user profile
app.get('/make-server-43af5861/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const user = await kv.get(`user:${userId}`)
    return c.json({ user })
  } catch (error) {
    console.log('Error getting user profile:', error)
    return c.json({ error: 'Failed to get user profile' }, 500)
  }
})

// Create a new post
app.post('/make-server-43af5861/posts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { familyCode, caption, imageIds } = await c.req.json()
    
    const postId = crypto.randomUUID()
    const now = new Date()
    const monthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const post = {
      id: postId,
      familyCode,
      authorId: user.id,
      caption,
      imageIds: imageIds || [],
      reactions: {},
      monthTag,
      createdAt: now.toISOString()
    }
    
    await kv.set(`post:${postId}`, post)
    
    // Add to family's posts index
    const familyPosts = await kv.get(`family:${familyCode}:posts`) || []
    familyPosts.unshift(postId) // Add to beginning for chronological order
    await kv.set(`family:${familyCode}:posts`, familyPosts)
    
    return c.json({ success: true, post })
  } catch (error) {
    console.log('Error creating post:', error)
    return c.json({ error: 'Failed to create post' }, 500)
  }
})

// Get family posts
app.get('/make-server-43af5861/families/:familyCode/posts', async (c) => {
  try {
    const familyCode = c.req.param('familyCode')
    const postIds = await kv.get(`family:${familyCode}:posts`) || []
    
    // Get all posts and their authors
    const posts = []
    for (const postId of postIds) {
      const post = await kv.get(`post:${postId}`)
      if (post) {
        const author = await kv.get(`user:${post.authorId}`)
        posts.push({
          ...post,
          author: author ? { name: author.name, avatar: author.avatar } : null
        })
      }
    }
    
    return c.json({ posts })
  } catch (error) {
    console.log('Error getting posts:', error)
    return c.json({ error: 'Failed to get posts' }, 500)
  }
})

// Toggle reaction on post
app.post('/make-server-43af5861/posts/:postId/react', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const postId = c.req.param('postId')
    const { reaction } = await c.req.json() // e.g., 'heart'
    
    const post = await kv.get(`post:${postId}`)
    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }
    
    if (!post.reactions[reaction]) {
      post.reactions[reaction] = []
    }
    
    // Toggle reaction
    const userIndex = post.reactions[reaction].indexOf(user.id)
    if (userIndex > -1) {
      post.reactions[reaction].splice(userIndex, 1) // Remove reaction
    } else {
      post.reactions[reaction].push(user.id) // Add reaction
    }
    
    await kv.set(`post:${postId}`, post)
    return c.json({ success: true, post })
  } catch (error) {
    console.log('Error toggling reaction:', error)
    return c.json({ error: 'Failed to toggle reaction' }, 500)
  }
})

// Upload image
app.post('/make-server-43af5861/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    
    const { data, error: uploadError } = await supabase.storage
      .from('make-43af5861-family-photos')
      .upload(filePath, file)
    
    if (uploadError) {
      console.log('Upload error:', uploadError)
      return c.json({ error: 'Failed to upload file' }, 500)
    }
    
    // Create signed URL for the uploaded file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('make-43af5861-family-photos')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 days
    
    if (urlError) {
      console.log('Signed URL error:', urlError)
      return c.json({ error: 'Failed to create signed URL' }, 500)
    }
    
    return c.json({ 
      success: true, 
      imageId: fileName,
      url: signedUrlData.signedUrl,
      path: filePath 
    })
  } catch (error) {
    console.log('Error uploading image:', error)
    return c.json({ error: 'Failed to upload image' }, 500)
  }
})

// Get signed URL for image
app.get('/make-server-43af5861/images/:userId/:imageId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const imageId = c.req.param('imageId')
    const filePath = `${userId}/${imageId}`
    
    const { data, error } = await supabase.storage
      .from('make-43af5861-family-photos')
      .createSignedUrl(filePath, 60 * 60 * 24) // 24 hours
    
    if (error) {
      console.log('Signed URL error:', error)
      return c.json({ error: 'Failed to get image URL' }, 500)
    }
    
    return c.json({ url: data.signedUrl })
  } catch (error) {
    console.log('Error getting image URL:', error)
    return c.json({ error: 'Failed to get image URL' }, 500)
  }
})

// Update user profile
app.put('/make-server-43af5861/users/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const userId = c.req.param('userId')
    
    // Check if user is updating their own profile
    if (user.id !== userId) {
      return c.json({ error: 'Cannot update another user\'s profile' }, 403)
    }
    
    const { name, avatar } = await c.req.json()
    
    const existingUser = await kv.get(`user:${userId}`)
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    const updatedUser = {
      ...existingUser,
      name: name || existingUser.name,
      avatar: avatar !== undefined ? avatar : existingUser.avatar,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`user:${userId}`, updatedUser)
    return c.json({ success: true, user: updatedUser })
  } catch (error) {
    console.log('Error updating user profile:', error)
    return c.json({ error: 'Failed to update user profile' }, 500)
  }
})

// Update family information
app.put('/make-server-43af5861/families/:familyId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const familyId = c.req.param('familyId')
    const { name, avatar } = await c.req.json()
    
    // Find family by ID
    const familyCodes = await kv.getByPrefix('family:')
    let targetFamily = null
    let targetFamilyCode = null
    
    for (const familyData of familyCodes) {
      if (familyData.id === familyId) {
        targetFamily = familyData
        targetFamilyCode = familyData.code
        break
      }
    }
    
    if (!targetFamily) {
      return c.json({ error: 'Family not found' }, 404)
    }
    
    // Check if user is the family admin
    if (targetFamily.createdBy !== user.id) {
      return c.json({ error: 'Only family admin can update family information' }, 403)
    }
    
    const updatedFamily = {
      ...targetFamily,
      name: name || targetFamily.name,
      avatar: avatar !== undefined ? avatar : targetFamily.avatar,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`family:${targetFamilyCode}`, updatedFamily)
    return c.json({ success: true, family: updatedFamily })
  } catch (error) {
    console.log('Error updating family information:', error)
    return c.json({ error: 'Failed to update family information' }, 500)
  }
})

// Remove family member
app.delete('/make-server-43af5861/families/:familyId/members/:memberId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const familyId = c.req.param('familyId')
    const memberId = c.req.param('memberId')
    
    // Find family by ID
    const familyCodes = await kv.getByPrefix('family:')
    let targetFamily = null
    let targetFamilyCode = null
    
    for (const familyData of familyCodes) {
      if (familyData.id === familyId) {
        targetFamily = familyData
        targetFamilyCode = familyData.code
        break
      }
    }
    
    if (!targetFamily) {
      return c.json({ error: 'Family not found' }, 404)
    }
    
    // Check if user is the family admin
    if (targetFamily.createdBy !== user.id) {
      return c.json({ error: 'Only family admin can remove members' }, 403)
    }
    
    // Cannot remove the admin themselves
    if (memberId === targetFamily.createdBy) {
      return c.json({ error: 'Cannot remove family admin' }, 400)
    }
    
    // Remove member from family
    const updatedMembers = targetFamily.members.filter(id => id !== memberId)
    const updatedFamily = {
      ...targetFamily,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`family:${targetFamilyCode}`, updatedFamily)
    
    // Remove family association from user
    await kv.del(`user:${memberId}:family`)
    
    return c.json({ success: true, family: updatedFamily })
  } catch (error) {
    console.log('Error removing family member:', error)
    return c.json({ error: 'Failed to remove family member' }, 500)
  }
})

// Sign up user
app.post('/make-server-43af5861/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })
    
    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Error signing up user:', error)
    return c.json({ error: 'Failed to sign up user' }, 500)
  }
})

// Initialize storage on startup
initStorage().catch(console.error)

export default {
  fetch: app.fetch,
}

Deno.serve(app.fetch)