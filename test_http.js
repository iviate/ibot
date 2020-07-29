// var http = require('http');

// const options = {
//     hostname: 'truthbet.com',
//     port: 80,
//     path: '/api/m/games',
//     headers: {
//         'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODE2Njc0fQ.xGTblTjSj_5Aej9De_lOqPLkL_-9k7qbQGNxdix9d9c',
//         'Content-Type': 'application/json'
//     },
//     method: 'GET', // RESQUEST METHOD
// };
// const req = http.request(options, response => {
    
//     // response.setEncoding('utf8');
//     response.on('data', chunk => {
//         console.log(chunk)
//     });

//     response.on('end', () => {
//         // end request
//     });
// });


// req.on('error', e => {
//     console.log('Problem with request:', e.message);
// });
// req.end();
const axios = require('axios');

axios.get('https://truthbet.com/api/m/games', 
{ 
        headers: { 
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODE2Njc0fQ.xGTblTjSj_5Aej9De_lOqPLkL_-9k7qbQGNxdix9d9c' 
        }})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.log(error);
  });