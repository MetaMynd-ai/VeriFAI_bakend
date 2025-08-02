module.exports = {
  apps: [
    {
      name: 'smartapi',         // process name in PM2
      script: 'yarn',           // run the yarn command
      args: 'start:dev',        // arguments passed to yarn
      watch: true,              // watch all files by default
      ignore_watch: [           // directories/files to ignore
        'node_modules',
        'dist',
        '.git'
      ]
      // no interpreter specified so PM2 uses the default shell
    }
  ]
};
