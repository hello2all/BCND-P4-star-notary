const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const {Blockchain, Block} = require('./simpleChain');
const Notary = require('./notary');
const notary = new Notary();
const bc = new Blockchain();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/block/:blockId', (req, res, next) => {
    bc.getBlock(req.params.blockId)
    .then(block => {
        res.json(block);
    })
    .catch(err => {
        next(err);
    }); 
});

app.get('/stars/address::address', (req, res, next) => {
    bc.getAddress(req.params.address)
    .then(block => {
        res.json(block);
    })
    .catch(err => {
        next(err);
    }); 
});

app.get('/stars/hash::hash', (req, res, next) => {
    bc.getHash(req.params.hash)
    .then(block => {
        res.json(block);
    })
    .catch(err => {
        next(err);
    }); 
});

app.post('/block', (req, res, next) => {
    try {
        if (!notary.isVerified(req.body.address)) throw new Error("Address is not validated or validation has been expired");
        if (!req.body.address) throw new Error("Address is not provided");
        if (!req.body.star) throw new Error("Star Details are not provided");
        if (!req.body.star.dec) throw new Error("Star dec is not provided");
        if (!req.body.star.ra) throw new Error("Star ra is not provided");
        if (!req.body.star.story) throw new Error("Star story is not provided");
        if (!/^[\x00-\x7F]*$/.test(req.body.star.story)) throw new Error("Star story only supports ASCII text");
        let story = new Buffer(req.body.star.story).toString('hex');
        if (story.length > 500) throw new Error("Start story exceeds maximum limit of 500 bytes");
        
        let blockData = {
            address: req.body.address,
            star: req.body.star
        };
        blockData.star.story = story;

        bc.addBlock(new Block(blockData))
        .then(block => {
            console.log(notary.openValidations, '++')
            notary.clearValidation(req.body.address);
            console.log(notary.openValidations, '++')
            res.json(block);
        })
        .catch(err => {
            next(err);
        }); 
    }
    catch(err) {
        next(err);
    }
});
app.post('/requestValidation', (req, res, next) => {
    try {
        let validationRequest = notary.registerValidationRequest(req.body.address);
        res.json({
            address: req.body.address,
            requestTimeStamp: validationRequest.requestTimeStamp,
            message: validationRequest.message,
            validationWindow: validationRequest.expireTime - notary.now()
        });
    }
    catch(err) {
        next(err);
    }
});
app.post('/message-signature/validate', (req, res, next) => {
    try {
        isRegistered = notary.isRegistered(req.body.address);
        if (isRegistered.status === false) {
            res.json({
                error: isRegistered["err-msg"],
                requestTimeStamp: notary.now()
            });
        }
        
        else if (notary.verifySignature(req.body.address, req.body.signature)) {
            res.json({
                registerStar: true,
                status: {
                    address: req.body.address,
                    requestTimeStamp: isRegistered.requestTimeStamp,
                    message: isRegistered.message,
                    validationWindow: isRegistered.validationWindow,
                    messageSignature: "valid"
                }
            });
        }
        else {
            
            res.json({
                error: "Invalid Signature",
                address: req.body.address,
                requestTimeStamp: notary.now()
            });
        }
    }
    catch(err) {
        next(err);
    }
});

app.use((req, res, next) => {
    const err = new Error('Page not found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message
        }
    });
});

app.listen(8000, () => console.log('Blockchain app listening on port 8000'));
