module.exports = {
    apps: [
      {
        name: 'client-server',
        script: 'client/client.server.js',
        watch: ['client/client.server.js'],
      },
      {
        name: 'admin-server',
        script: 'admin/admin.server.js',
        watch: ['admin/admin.server.js'],
        ignore_watch: ['settings.json'],
      },
    ],
  };
  