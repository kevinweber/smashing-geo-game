import express from 'express';
import https from 'https';

const app = express();
const IS_DEV = process.env.NODE_ENV === 'development';

// It's important to prefer process.env.PORT over a custom port
// because some cloud platforms don't let you choose the port
const PORT = process.env.PORT || 8000;

// The path that you provide to the express.static function is
// relative to the directory from where you launch your node process
app.use(express.static('web'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'web' });
});

app.listen(PORT, () => {
  if (IS_DEV) {
    console.log(`⚡️ Server is running at http://localhost:${PORT}`);
  } else {
    console.log('⚡️ Server is running');
  }
});

https.createServer({}, app);

process.on('unhandledRejection', (reason) => {
  console.log(reason);
  process.exit(1);
});
