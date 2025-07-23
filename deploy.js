/**
 * Deployment preparation script for ProductivityHub
 * 
 * This script helps prepare your project for deployment by:
 * 1. Checking for required environment variables
 * 2. Building the frontend
 * 3. Providing deployment instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 ProductivityHub Deployment Preparation\n');

// Check if .env file exists for frontend
const frontendEnvPath = path.join(__dirname, '.env');
if (!fs.existsSync(frontendEnvPath)) {
  console.log('⚠️  Frontend .env file not found. Creating one...');
  
  rl.question('Enter your backend API URL (e.g., https://your-backend.herokuapp.com/api): ', (apiUrl) => {
    fs.writeFileSync(frontendEnvPath, `VITE_API_URL=${apiUrl}\n`);
    console.log('✅ Frontend .env file created successfully!');
    continueDeployment();
  });
} else {
  console.log('✅ Frontend .env file found.');
  continueDeployment();
}

function continueDeployment() {
  // Check if server env file exists
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  if (!fs.existsSync(serverEnvPath)) {
    console.log('⚠️  Server .env file not found. Please create one before deployment.');
    console.log('   See server/env.example for required variables.');
  } else {
    console.log('✅ Server .env file found.');
  }

  console.log('\n🔨 Building frontend application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Frontend build successful!');
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    process.exit(1);
  }

  console.log('\n📋 Deployment Checklist:');
  console.log('  1. Push your code to GitHub');
  console.log('  2. Deploy frontend to Vercel');
  console.log('  3. Deploy server to Render or Heroku');
  console.log('  4. Set up MongoDB Atlas');
  console.log('  5. Configure environment variables on both platforms');
  console.log('\n📚 For detailed instructions, see DEPLOYMENT.md');

  console.log('\n🌐 Recommended hosting platforms:');
  console.log('  - Frontend: Vercel (https://vercel.com)');
  console.log('  - Backend: Render (https://render.com) or Heroku (https://heroku.com)');
  console.log('  - Database: MongoDB Atlas (https://www.mongodb.com/cloud/atlas)');

  rl.close();
}

rl.on('close', () => {
  console.log('\n🚀 Ready for deployment! Good luck!');
  process.exit(0);
}); 