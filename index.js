////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Module Imports ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
const express = require('express');
const bodyParser = require('body-parser');

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Server Setup //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
const app = express();
// const API_PORT = 3030;
// const config = require('./config');

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Middleware ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Routes ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    let response = `You are at the root.`
    res.send(response);
    }
);

app.get('/test', (req, res) => {
    let response = `You are at the test route.`
    res.send(response);
    }
);

app.use('/household', require('./routes/household'));
app.use('/admin', require('./routes/admin'));

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Server Start /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Example app is listening on port ${port}.`)
);