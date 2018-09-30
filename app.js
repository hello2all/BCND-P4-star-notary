const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const {Blockchain, Block} = require('./simpleChain');
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
app.post('/block', (req, res, next) => {
    if(req.body.body) {
        bc.addBlock(new Block(req.body.body))
        .then(block => {
            res.json(block);
        })
        .catch(err => {
            next(err);
        }); 
    }
    else {
        next(new Error("Invalid block body"))
    }
});
app.post('/requestValidation', (req, res, next) => {
    if(req.body) {
        // TODO: request validation
    }
    else {
        next(new Error("Invalid block body"))
    }
});

app.use((req, res, next) => {
    const err = new Error('Page not found')
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
