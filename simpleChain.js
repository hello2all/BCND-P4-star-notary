/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.addBlock(new Block("First block in the chain - Genesis block"));
  }

  // Add new block
  addBlock(newBlock){
    return this.getBlockHeight()
    .then(currentBlockHeight => {
      // Block height
      newBlock.height = currentBlockHeight + 1;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      // previous block hash
      if(currentBlockHeight >= 0){
        return this.getBlock(currentBlockHeight)
        .then(lastBlock => {
          newBlock.previousBlockHash = lastBlock.hash;
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
          // Adding block object to chain
          db.put(newBlock.height, JSON.stringify(newBlock));

          return newBlock;
        });
        
      }
      else {
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        db.put(newBlock.height, JSON.stringify(newBlock));
        return newBlock;
      }
    })
    .catch(err => {
      throw err;
    });

  }

  // Get block height
  getBlockHeight(){
    let i = -1;
    return new Promise((resolve, reject) => {
      db.createReadStream()
      .on('data', function(data) {
        i++;
      })
      .on('error', function(err) {
          reject(err);
      })
      .on('close', () => {
        resolve(i);
      });
    });
  }

  // get block
  getBlock(blockIndex){
    var blockHeight = parseInt(blockIndex);
    return db.get(blockHeight)
      .then(res => {
        let blockData = JSON.parse(res);
        if (typeof blockData.body.address == "undefined") return blockData;
        else {
          let story = new Buffer(blockData.body.star.story, 'hex').toString('utf8');
          blockData.body.star.story = story;
          return blockData;
        }
          
        
      })
      .catch(e => {
        throw new Error("can't find the block");
      });
  }

  getAddress(address){
    let stars = [];
    return new Promise((resolve, reject) => {
      db.createReadStream()
      .on('data', function(data) {
        let blockData = JSON.parse(data.value);
        if (typeof blockData.body.address == "undefined") return;
        if (blockData.body.address == address) {
          let story = new Buffer(blockData.body.star.story, 'hex').toString('utf8');
          blockData.body.star.story = story;
          stars.push(blockData);
        }
      })
      .on('error', function(err) {
          reject(err);
      })
      .on('close', () => {
        resolve(stars);
      });
    });
  }

  getHash(hash){
    return new Promise((resolve, reject) => {
      db.createReadStream()
      .on('data', function(data) {
        let blockData = JSON.parse(data.value);
        if (blockData.hash == hash) {
          let story = new Buffer(blockData.body.star.story, 'hex').toString('utf8');
          blockData.body.star.story = story;
          resolve(blockData);
        }
      })
      .on('error', function(err) {
          reject(err);
      })
      .on('close', () => {
        resolve(null);
      });
    });
  }

  // validate block
  validateBlock(blockHeight){
    // get block object
    return this.getBlock(blockHeight)
    .then(block => {
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
    })
    .catch(err => {
      throw err;
    });
  }

  // Validate blockchain
  validateChain(){
    let errorLog = [];
    let heights = [];
    return this.getBlockHeight()
    .then(currentBlockHeight => {
      for (var i = 1; i <= currentBlockHeight; i++) {
        heights.push(i);
      }
      return Promise.all(heights.map(height => {
        return this.getBlock(height);
      }));
    })
    .then(blocks => {
      for(var j = 0; j < blocks.length; j++) {

        let blockHash = blocks[j].hash;
        let previousHash = j < blocks.length - 1 ? blocks[j+1].previousBlockHash : null;
        blocks[j].hash = ''; // remove block hash to re-calculate the block hash
        let validBlockHash = SHA256(JSON.stringify(blocks[j])).toString();
        blocks[j].hash = blockHash; // re-attach has to block
        // examine current block's hash
        if (validBlockHash != blocks[j].hash) {
          console.log(`Block ${blocks[j].height} has wrong hash`);
          errorLog.push(blocks[j].height);
        }
        else {
          console.log(`Block ${blocks[j].height} has correct hash`);
        }
        // examine the next block's previous hash
        if (blockHash!==previousHash && previousHash) {
          console.log(`Block ${blocks[j+1].height} has wrong previousHash`);
          errorLog.push(blocks[j+1].height);
        }
        else if (previousHash) {
          console.log(`Block ${blocks[j+1].height} has correct previousHash`);
        }
      }
      return errorLog;
    })
    .catch(err => {
      throw err;
    });
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;