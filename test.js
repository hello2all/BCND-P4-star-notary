const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const request = require('request');

const keyPair = bitcoin.ECPair.makeRandom();
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });


console.log("generated new key pair");
console.log("address: ", address);
console.log("private key: ", keyPair.toWIF());

var message;
var hash;
var height

var testScenarios = {
    requestValidation: () => {
        let options = {
            uri: 'http://localhost:8000/requestValidation',
            method: 'POST',
            json: {
                address: address
            }
        };
    
        request(options, (err, res, body) => {
            console.log("===request validation response===");
            console.log(body);
            message = body.message;
        });
    },

    validateSignature: () => {
        let options = {
            uri: 'http://localhost:8000/message-signature/validate',
            method: 'POST',
            json: {
                address: address,
                signature: bitcoinMessage.sign(message, keyPair.privateKey, keyPair.compressed)
            }
        };

        request(options, (err, res, body) => {
            console.log("===validate signature response===");
            console.log(body);
        });
    },

    registerNewStar: () => {
        let options = {
            uri: 'http://localhost:8000/block',
            method: 'POST',
            json: {
                address: address,
                star: {
                    dec: "-26° 29'\'' 24.9",
                    ra: "16h 29m 1.0s",
                    story: "Found star using https://www.google.com/sky/"
                }
            }
        };

        request(options, (err, res, body) => {
            console.log("===register new star response===");
            console.log(body);
            hash = body.hash;
            height = body.height;
        });
    },

    searchByAddress: () => {
        let options = {
            uri: 'http://localhost:8000/stars/address:' + address,
            method: 'GET'
        };

        request(options, (err, res, body) => {
            console.log("===search by address===");
            console.log(body);
        });
    },

    searchByHash: () => {
        let options = {
            uri: 'http://localhost:8000/stars/hash:' + hash,
            method: 'GET'
        };

        request(options, (err, res, body) => {
            console.log("===search by hash===");
            console.log(body);
        });
    },

    searchByBlockHeight: () => {
        let options = {
            uri: 'http://localhost:8000/block/' + height,
            method: 'GET'
        };
        request(options, (err, res, body) => {
            console.log("===search by block height===");
            console.log(body);
        });
    },
};


setTimeout(() => {
    testScenarios.requestValidation();
}, 1000);

setTimeout(() => {
    testScenarios.validateSignature();
}, 2000);

setTimeout(() => {
    testScenarios.registerNewStar();
}, 3000);



setTimeout(() => {
    testScenarios.searchByAddress();
}, 4000);

setTimeout(() => {
    testScenarios.searchByHash();
}, 5000);

setTimeout(() => {
    testScenarios.searchByBlockHeight();
}, 6000);

setTimeout(() => {
    console.log("===Attempt to register a star again===");
    testScenarios.registerNewStar();
}, 7000);