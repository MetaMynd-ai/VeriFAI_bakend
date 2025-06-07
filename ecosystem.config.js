module.exports = {
  apps: [
    {
      name: 'smartapi',          // process name in PM2
      script: 'yarn',            // command to run
      args: 'start:dev',         // arguments passed to yarn
      watch: true,               // watch all files by default
      ignore_watch: [            // directories/files to ignore
        'node_modules',
        'dist',
        '.git'
      ],
      interpreter: 'bash'        // use bash to run the script
    }
  ]
};
