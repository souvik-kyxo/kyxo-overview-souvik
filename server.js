const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const tasksRouter = require('./src/routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api/tasks', tasksRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`To-Do List server running on http://localhost:${PORT}`);
});
