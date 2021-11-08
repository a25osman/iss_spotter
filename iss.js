/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const request = require('request');
const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API
  request('https://api.ipify.org?format=json', (error, response, body) => {
    
    // inside the request callback ...
    // error can be set if invalid domain, user is offline, etc.
    if (error) {
      callback(error, null);
      return error;
    }
    
    // if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    // if we get here, all's well and we got the data


    const obj = JSON.parse(body);
    if (obj.ip) {
      callback(null, obj.ip);
    }
  });
};


const fetchCoordsByIP = function(ip, callback) {
  request(`https://api.freegeoip.app/json/${ip}?apikey=6ed35120-3e3e-11ec-b196-9fd8abf22988`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching geodata. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    const obj = {"latitude": JSON.parse(body).latitude,   "longitude": JSON.parse(body).longitude};
    callback(null, obj);

  });
};


const fetchFlyoverISS = function(obj, callback) {
  request(`https://iss-pass.herokuapp.com/json/?lat=${obj.latitude}&lon=${obj.longitude}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return error;
    }

    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching geodata. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }

    const content = JSON.parse(body);
    // const obj = {"message": content.message, "request": content.request, "response": content.response};
    const obj = content.response;
    callback(null, obj);

  });
};

/**
* Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
* Input:
*   - A callback with an error or results. 
* Returns (via Callback):
*   - An error, if any (nullable)
*   - The fly-over times as an array (null if error):
*     [ { risetime: <number>, duration: <number> }, ... ]
*/  
const nextISSTimesForMyLocation = function(callback) {

  fetchMyIP((error, ip) => {
    if (error) {
      return callback(error, null);
    }  
    fetchCoordsByIP(ip, (error, data) => {  
      if (error) {
        return callback(error, null);
      }
      fetchFlyoverISS(data, (error, nextPasses) => {
        if (error) {
          return callback(error, null);
        }
        callback(null, nextPasses);
      });
    });
  });
}

module.exports = { fetchMyIP, fetchCoordsByIP, fetchFlyoverISS, nextISSTimesForMyLocation};