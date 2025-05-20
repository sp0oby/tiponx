// Simple script to clean up a user's profile
const fetch = require('node-fetch');

async function cleanupProfile(handle) {
  try {
    const response = await fetch('http://localhost:3000/api/users/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ handle })
    });

    const result = await response.json();
    console.log('Cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Error cleaning up profile:', error);
    throw error;
  }
}

// Get handle from command line argument
const handle = process.argv[2];
if (!handle) {
  console.error('Please provide a handle as argument (e.g. node cleanup-profile.js @username)');
  process.exit(1);
}

cleanupProfile(handle)
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 