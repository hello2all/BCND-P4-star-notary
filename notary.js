const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

class Notary {
    now() {
        return parseInt(new Date().getTime()/1000);
    }

    registerValidationRequest (address) {
        // if address already exist and not yet expired
        if(typeof this.openValidations[address] != "undefined") {
            console.log(this.openValidations[address].expireTime, this.now())
            if (this.openValidations[address].expireTime > this.now()) {
                return this.openValidations[address];
            }
        }

        // if address does not exist or registered request expired
        let validationRequest = {
            message: this.getValidationMsg(address, this.now()),
            requestTimeStamp: this.now(),
            expireTime: this.now() + this.validationWindow,
            verified: false
        };
        this.openValidations[address] = validationRequest;
        return validationRequest;
    }

    isRegistered (address) {
        if (typeof this.openValidations[address] == "undefined") {
            return {
                status: false,
                "err-msg": "Not yet registered for validation"
            };
        }
        else if (this.openValidations[address].expireTime < this.now()) {
            return {
                status: false,
                "err-msg": "Validation request expired"
            };
        }
        else {
            return {
                status: true,
                requestTimeStamp: this.openValidations[address].requestTimeStamp,
                message: this.openValidations[address].message,
                validationWindow: this.openValidations[address].expireTime - this.now()
            };
        }
    }

    getValidationMsg(address, time) {
        return `${address.toString()}:${time}:starRegistry`;
    }

    verifySignature(address, signature) {
        let message = this.openValidations[address].message;
        let verified = bitcoinMessage.verify(message, address, signature);

        if (verified) {
            this.openValidations[address].verified = true;
        }
        return verified;
    }

    isVerified(address) {
        console.log(this.openValidations[address], '--')
        return this.openValidations[address].verified;
    }

    clearValidation(address) {
        this.openValidations[address].verified = false;
    }

    constructor() {
        this.openValidations = {};
        this.validationWindow = 300;
    }
}

module.exports = Notary;