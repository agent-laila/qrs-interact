var nock = require('nock');
var qrsInteractMain = require('../qrsInteract');
var request = require('request');


// test setup

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

var xrfkey = generateXrfKey();
var xrfkeyParam = "xrfkey=" + xrfkey;

var qrsInteractInstance = new qrsInteractMain("http://test.factory", xrfkeyParam, request);



// test case 1

var test1Return = {
    buildVersion: '3.0.2.0',
    buildDate: '9/20/2013 10:09:00 AM',
    databaseProvider: 'Devart.Data.PostgreSql',
    nodeType: 1,
    schemaPath: 'About'
};

var scope = nock('http://test.factory')
    .get('/about' + '?' + xrfkeyParam)
    .reply(200, test1Return);

qrsInteractInstance.Get('about').then(function(result) {
    if (JSON.stringify(result) != JSON.stringify(test1Return)) {
        throw "testcase 1 failed - Get returned wrong result.";
    } else {
        console.log("testcase 1 passed. - Get");
    }
});

// test case 2

var test2Return = {
    id: "2454e69a-d2fe-4d1a-bc64-52c5b4232e87",
    createdDate: "2016-09-28T16:20:39.982Z",
    modifiedDate: "2016-09-28T16:20:39.982Z",
    modifiedByUserName: "INTERNAL\\sa_repository",
    name: "tagTest",
    privileges: null,
    schemaPath: "Tag"
};

var scope = nock('http://test.factory')
    .post('/tag' + '?' + xrfkeyParam, {
        "id": "2454e69a-d2fe-4d1a-bc64-52c5b4232e87",
        "name": "tagTest",
        "privileges": null
    })
    .reply(201, test2Return);

qrsInteractInstance.Post('tag', JSON.stringify({
    id: "2454e69a-d2fe-4d1a-bc64-52c5b4232e87",
    name: "tagTest",
    privileges: null
}), 'json').then(function(result) {
    if (JSON.stringify(result) != JSON.stringify(test2Return)) {
        throw "testcase 2 failed - Post returned wrong result.";
    } else {
        console.log("testcase 2 passed. - Post");
    }
});