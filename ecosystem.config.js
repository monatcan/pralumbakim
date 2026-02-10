module.exports = {
  apps: [
    {
      name: 'bakim-app',
      script: 'npm.cmd', // Windows requires npm.cmd
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Ensure DATABASE_URL is explicitly passed if not loaded by Next.js automatically in this context,
        // typically Next.js loads .env but passing it here ensures it's available to the process immediately.
      },
    },
  ],
};
