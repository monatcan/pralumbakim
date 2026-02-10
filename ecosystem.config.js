module.exports = {
  apps: [
    {
      name: 'bakim-app',
      script: 'npm',
      args: 'start',
      cwd: './', // Ensure we are in the project root
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
  ],
};
