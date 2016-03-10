var request = require("request");
var fs = require("fs");
var async = require("async");


var bitrixAccessToken = function (options) {

    var bitrixConfig = options;

    if (!bitrixConfig.domain || !bitrixConfig.grantType || !bitrixConfig.clientId || !bitrixConfig.clientSecret || !bitrixConfig.scope || !bitrixConfig.redirectURL || !bitrixConfig.refreshToken || !bitrixConfig.path) {
        throw Error('Define properties for bitrix access');
    }

    bitrixConfig.accessToken = '';

    var requestToken = function (options) {

        var httpRequest = function (options, callback) {
            request(options.domain + "/oauth/token/?grant_type=" + options.grantType +
                "&client_id=" + options.clientId + "&client_secret=" + options.clientSecret +
                "&refresh_token=" + options.refreshToken + "&scope=" + options.scope +
                "&redirect_uri=" + options.redirectURL, function (error, response, body) {
                callback(error, response, body)
            })
        };

        var writeRequest = function (response, body, callback) {
            var answer = JSON.parse(body);

            fs.writeFile(options.path, JSON.stringify({
                domain: options.domain,
                grantType: options.grantType,
                clientId: options.clientId,
                clientSecret: options.clientSecret,
                scope: options.scope,
                redirectURL: options.redirectURL,
                refreshToken: answer.refresh_token,
                path: options.path
            }), function (err) {
                if (err) return console.log(err);
            });

            bitrixConfig.accessToken = answer.access_token;
            bitrixConfig.refreshToken = answer.refresh_token;

            if (typeof callback === 'function') {
                return callback();
            }
        };

        async.waterfall([
            httpRequest.bind(null, options),
            writeRequest
        ], function (err, result) {
        });
    };

    var updateAccessToken = function (req, res, next) {
        req.accessToken = bitrixConfig.accessToken;
        next();
    };

    setInterval(requestToken.bind(null, bitrixConfig), 1000*60*59);
    requestToken(bitrixConfig);

    return updateAccessToken;
};


module.exports = bitrixAccessToken;
