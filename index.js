var config = require('./config/config');
var common = require('./common');
var request = require('request');
var fs = require('fs');
var Promise = require('bluebird');
var winston = require('winston');
var extend = require('extend');

var qrsInteract = function QRSInteract(inputConfig) {
    var generateXrfKey = function() {
        var xrfString = "";
        for (i = 0; i < 16; i++) {
            if (Math.floor(Math.random() * 2) == 0) {
                xrfString += Math.floor(Math.random() * 10).toString();
            } else {
                var charNumber = Math.floor(Math.random() * 26);
                if (Math.floor(Math.random() * 2) == 0) {
                    //small letter
                    xrfString += String.fromCharCode(charNumber + 97);
                } else {
                    xrfString += String.fromCharCode(charNumber + 65);
                }
            }
        }
        return xrfString;
    }

    var updateConfig = function(inputConfig)
    {
        var newConfig = common.clone(config);
        if (typeof inputConfig == 'string')
        {
            newConfig.hostname = inputConfig;
        }
        else
        {
            newConfig = extend(true, newConfig, inputConfig);
        }
        return newConfig;
    }

    var localConfig = updateConfig(inputConfig);


    var defaultPort = localConfig.portNumber;
    var basePath = "https://" + localConfig.hostname + ":" + defaultPort + "/qrs";
    var xrfkey = generateXrfKey();
    var xrfkeyParam = "xrfkey="+xrfkey;
    var defaults = request.defaults({
        rejectUnauthorized: false,
        host: localConfig.hostname,
        cert: fs.readFileSync(localConfig.certificates.client),
        key: fs.readFileSync(localConfig.certificates.client_key),
        ca: fs.readFileSync(localConfig.certificates.root),
        headers: {
            'X-Qlik-User': localConfig.repoAccount,
            'X-Qlik-Xrfkey': xrfkey,
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip'
        },
        gzip: true,
        json: true
    });

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }

    var generateXrfKey = function() {
        var xrfString = "";
        for (i = 0; i < 16; i++) {
            if (Math.floor(Math.random() * 2) == 0) {
                xrfString += Math.floor(Math.random() * 10).toString();
            } else {
                var charNumber = Math.floor(Math.random() * 26);
                if (Math.floor(Math.random() * 2) == 0) {
                    //small letter
                    xrfString += String.fromCharCode(charNumber + 97);
                } else {
                    xrfString += String.fromCharCode(charNumber + 65);
                }
            }
        }
    }

    var getFullPath = function(path) {
        var newPath = basePath;
        if (!path.startsWith('/')) {
            newPath += '/';
        }
        newPath += path;
        if (newPath.endsWith('/')) {
            newPath = newPath.substr(0, newPath.length - 1);
        }

        var indexOfSlash = newPath.lastIndexOf('/');
        var indexOfQuery = newPath.lastIndexOf('?');
        if (indexOfQuery <= indexOfSlash) {
            newPath += '?' + xrfkeyParam;
        } else {
            newPath += '&' + xrfkeyParam;
        }

        return newPath;
    }

    this.Get = function(path) {
        return new Promise(function(resolve, reject) {
            path = getFullPath(path);
            var sCode;
            var r = defaults;
            var res = '';
            r.get(path)
                .on('response', function(response, body) {
                    sCode = response.statusCode;
                })
                .on('data', function(chunk) {

                    if (sCode == 200) {
                        res += chunk;
                    } else {
                        reject("Received error code: " + sCode);
                    }
                })
                .on('error', function(error) {

                })
                .on('end', function() {
                    resolve(JSON.parse(res));
                });

        });
    };

    this.Post = function(path, body, sendType) {
        return new Promise(function(resolve, reject) {
            path = getFullPath(path);
            var sCode;
            var r = defaults;
            var res = '';
            var finalBody = body != undefined ? (sendType.toLowerCase() == 'json' ? body : JSON.stringify(body)) : undefined;
            r({
                    url: path,
                    method: 'POST',
                    body: finalBody
                })
                .on('response', function(response, body) {
                    sCode = response.statusCode;
                })
                .on('error', function(err) {

                })
                .on('data', function(data) {
                    if (sCode == 200 || sCode == 201) {
                        res += data;
                    } else {
                        reject("Received error code: " + sCode + '::' + data);
                    }
                })
                .on('end', function() {
                    resolve(JSON.parse(res));
                });
        });
    };

    this.Put = function(path, body) {
        return new Promise(function(resolve, reject) {
            path = getFullPath(path);
            var sCode;
            var r = defaults;
            r({
                    url: path,
                    method: 'PUT',
                    body: body
                })
                .on('response', function(response, body) {
                    sCode = response.statusCode;
                    if (sCode == 204) {
                        resolve(sCode);
                    } else {
                        reject(sCode)
                    }
                })
                .on('error', function(err) {

                });
        })
    };

    this.Delete = function(path) {
        return new Promise(function(resolve, reject) {
            path = getFullPath(path);
            var sCode;
            var r = defaults;

            r({
                    url: path,
                    method: 'DELETE'
                })
                .on('response', function(response) {
                    sCode = response.statusCode;

                    if (sCode == 204) {
                        resolve(sCode);
                    } else {
                        reject("Received error code: " + sCode);
                    }
                })
                .on('error', function(error) {

                });
        });
    };

    this.GetBasePath = function()
    {
        return "https://" + localConfig.hostname + ":" + defaultPort + "/qrs";
    }
};

module.exports = qrsInteract;