const app = require('./app');

const PORT = process.env.PORT || 3001;

// Local development: start the server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`EVAGO backend server listening on port ${PORT}`);
  });
}

// Vercel serverless function export
module.exports = app;
