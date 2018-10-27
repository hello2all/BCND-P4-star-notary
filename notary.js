const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

class Notary {
    now() {
        return parseInt(new Date().getTime()/1000);
    }

    registerValidationRequest (address) {
        // if address already exist and not yet expired
        if(typeof this.openValidations[address] != "undefined") {
            if (this.openValidations[address].expireTime < this.now()) {
                return this.openValidations[address];
            }
        }

        // if address does not exist or registered request expired
        let validationRequest = {
            message: this.getValidationMsg(address, this.now()),
            expireTime: this.now() + this.validationWindow,
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
            this.verifiedAddresses[address] = true;
        }
        return verified;
    }

    isVerified(address) {
        if (this.verifiedAddresses[address]) return true;
        else return false;
    }

    clearValidation(address) {
        delete this.verifiedAddresses[address];
        delete this.openValidations[address];
    }

    constructor() {
        this.openValidations = {};
        this.verifiedAddresses = {};
        this.validationWindow = 300;
    }
}

module.exports = Notary;