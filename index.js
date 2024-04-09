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
    const allTestLinks = `<li> <a href="http://localhost:3030/household">Household</a> </li> <li> <a href="http://localhost:3030/admin">Admin</a> </li>`;
    const response = `<div> <h1>Root Directory</h1> <p>Testing URLs <ul> ${allTestLinks} </ul> </p> </div>`
    res.send(response);
    }
);

app.get('/test', (req, res) => {
    const allTestLinks = `<li> <a href="http://localhost:3030/household">Household</a> </li> <li> <a href="http://localhost:3030/admin">Admin</a> </li>`;
    const response = `<div> <h1>Test in Root Directory</h1> <p>Testing URLs <ul> ${allTestLinks} </ul> </p> </div>`
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