module.exports = {
  apps: [
    {
      name: 'bakim-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXTAUTH_URL: 'https://gemtech.net.tr', // Public URL
      },
    },
  ],
};
