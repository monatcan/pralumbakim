module.exports = {
  apps: [
    {
      name: 'bakim-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
  ],
};
