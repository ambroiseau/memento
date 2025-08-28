#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function execCommand(command, options = {}) {
  try {
    console.log(`\n🔄 Running: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

async function setupGitHub() {
  console.log('🚀 GitHub Repository Setup\n');
  console.log('This script will help you push your Memento app to GitHub.\n');
  
  console.log('📋 Steps to complete:');
  console.log('1. Create a new repository on GitHub.com');
  console.log('2. Copy the repository URL');
  console.log('3. Enter it below\n');
  
  const repoUrl = await question('Enter your GitHub repository URL (e.g., https://github.com/username/memento-app.git): ');
  
  if (!repoUrl || !repoUrl.includes('github.com')) {
    console.error('❌ Invalid GitHub URL. Please provide a valid GitHub repository URL.');
    rl.close();
    return;
  }
  
  console.log('\n🔄 Setting up remote repository...');
  
  // Add the remote origin
  execCommand(`git remote add origin ${repoUrl}`);
  
  // Push to GitHub
  console.log('\n🚀 Pushing to GitHub...');
  execCommand('git push -u origin main');
  
  console.log('\n✅ Successfully pushed to GitHub!');
  console.log(`\n📱 Your repository is now available at: ${repoUrl.replace('.git', '')}`);
  
  console.log('\n🎉 Next steps:');
  console.log('1. Visit your GitHub repository');
  console.log('2. Set up GitHub Pages (optional)');
  console.log('3. Configure deployment from GitHub');
  console.log('4. Share your repository with others');
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Run the setup
setupGitHub().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
