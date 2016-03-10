var request = require("request");
var fs = require("fs");
var async = require("async");

var bitrixConfig = {};

var writeRequest = function (response, body, callback) {
    var answer = JSON.parse(body);

    fs.writeFile(bitrixConfig.path, JSON.stringify({
        domain: bitrixConfig.domain,
        grantType: bitrixConfig.grantType,
        clientId: bitrixConfig.clientId,
        clientSecret: bitrixConfig.clientSecret,
        scope: bitrixConfig.scope,
        redirectURL: bitrixConfig.redirectURL,
        refreshToken: answer.refresh_token,
        path: bitrixConfig.path
    }), function (err) {
        if (err) return console.error(err);
    });

    bitrixConfig.accessToken = answer.access_token;
    bitrixConfig.refreshToken = answer.refresh_token;

    if (typeof callback === 'function') {
        return callback();
    }
};

var httpRequest = function (callback) {
    request(bitrixConfig.domain + "/oauth/token/?grant_type=" + bitrixConfig.grantType +
        "&client_id=" + bitrixConfig.clientId + "&client_secret=" + bitrixConfig.clientSecret +
        "&refresh_token=" + bitrixConfig.refreshToken + "&scope=" + bitrixConfig.scope +
        "&redirect_uri=" + bitrixConfig.redirectURL, function (error, response, body) {
        callback(error, response, body)
    })
};

var requestToken = function () {
    async.waterfall([
        httpRequest,
        writeRequest
    ]);
};

var updateAccessToken = function (req, res, next) {
    req.accessToken = bitrixConfig.accessToken;
    next();
};

var bitrixAccessToken = function (options) {

    bitrixConfig = options;

    if (!bitrixConfig.domain || !bitrixConfig.grantType || !bitrixConfig.clientId || !bitrixConfig.clientSecret || !bitrixConfig.scope || !bitrixConfig.redirectURL || !bitrixConfig.refreshToken || !bitrixConfig.path) {
        throw Error('Define properties for bitrix access');
    }

    bitrixConfig.accessToken = '';

    setInterval(requestToken, 1000*60*59);
    requestToken();

    return updateAccessToken;
};


module.exports = bitrixAccessToken;
