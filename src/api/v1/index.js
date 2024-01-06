const fs = require('fs');
const express = require('express');
const cors = require('cors');
const router = express.Router();
const logsDir = `${__dirname}/../../../logs`;
const corsOptions = {
  origin: '*',
};

router.all('*', cors(corsOptions));

router.get('/logs', async (request, response) => {
  fs.readdir(logsDir, {}, (error, files = []) => {
    response
      .setHeader('Content-Type', 'application/json')
      .end(JSON.stringify(files.reverse()));
  });
});

router.get('/logs/:log', async (request, response) => {
  fs.readFile(`${logsDir}/${request.params.log}`, 'utf8', (error, data) => {
    if (error) {
      response
        .status(404)
        .send('File not found!');

      return;
    }

    response.setHeader('Content-Type', 'application/json');
    response.end(data);
  });
});

module.exports = router;
