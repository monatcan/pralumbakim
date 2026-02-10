module.exports = {
  apps: [
    {
      name: 'bakim-app',
      script: '.next/standalone/server.js',
      cwd: './', // Run from root so it can find .env and potentially other resources
      node_args: '-r dotenv/config', // Ensure .env is loaded if standalone doesn't do it automatically
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1', // Force IPv4 to match IIS configuration
      },
    },
  ],
};
