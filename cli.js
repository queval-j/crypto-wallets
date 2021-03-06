#!/usr/bin/env node

// grab command line arguments
const [,, ...args] = process.argv;

// import cryptowallets library
const cw = require('./cryptowallets');

// set console.log max array size to unlimited
require('util').inspect.defaultOptions.maxArrayLength = null;

function generateNAddresses(currency, n){
	var wallets = [];
	for(var i = 0; i < n; i++){
		wallets.push(cw.generateWallet(currency));
	}
	return wallets;
}

async function generateNAsyncAddresses(currency, n){
	var wallets = [];
	for(var i = 0; i < n; i++){
		var wallet = await cw.generateWallet(currency)
		wallets.push(wallet);
	}
	return wallets;
}

module.exports = {
	helpMsg: `
Usage:
crypto-wallets <command> [arguments]
	
Commands:
help, h, -help, --help: Prints this help message
	
generate <currency> [number] [--save <file>]: 
    Generates and prints private keys and addresses for the specified currency.
    If [number] is provided, that many wallets will be generated.
    If no [number] is provided, one wallet will be generated.
	If the --save flag is provided, the results will be saved to the given file in CSV format.
    Supported currencies:
    BTC, BCH, DOGE, ETH, IOTA, LTC, NMC, PPC, XMR, XTZ
		
verify <currency> <privateKey> <address>: 
    Verifies that the given privateKey corresponds to the given address in the given currency.`,
	parseArgs: async function(args){
		try{
			var index = args.indexOf('--save');
			var saveFile = undefined;
			if(index > 0){
				var saveFile = args[index+1];
				args.splice(index, 2);
			}
			switch(args[0]){
				case "help":
				case "h":
				case "-help":
				case "--help":
				case undefined:
					console.log(this.helpMsg);
					break;
				case "generate":
					if(args.length < 2){
						console.log("Usage: generate <currency> [number] [--save <file>]");
						break;
					}
					if(args[1].toLowerCase() == "xmr" || args[1].toLowerCase() == "iota"){
						var wallets = await generateNAsyncAddresses(args[1], (args.length > 2)? args[2] : 1);
					} else {
						var wallets = generateNAddresses(args[1], (args.length > 2)? args[2] : 1);
					}
					
					if(saveFile){
						var fs = require('fs');
						var rows = [Object.keys(wallets[0])];
						wallets = wallets.map(e=>Object.values(e));
						rows = rows.concat(wallets);
						let csvContent = rows.map(e=>e.join(",")).join("\n");
						
						fs.writeFile(saveFile, csvContent, function(err) {
							if(err) {
								return console.log(err);
							}
							console.log("Successfully saved to file: " + saveFile);
						}); 
					} else {
						console.log(wallets);
					}
					break;
				case "verify":
					if(args.length < 4){
						console.log("Usage: verify <currency> <privateKey> <address>");
						break;
					} else {
						try{
							var res = cw.verifyPrivateKey(args[1], args[2], args[3]);
							if(res === true)
								console.log("Success: The private key matches the address");
							else if(res.then){ // if a promise is returned, resolve it
								res = await res;
								if(res)
									console.log("Success: The private key matches the address");
								else
									console.log("Failure: The private key does not match the address");
							
							} else
								console.log("Failure: The private key does not match the address");
						}catch(err){
							console.log("Failure: The private key does not match the address");
						}
						break;
					}
				default:
					console.log("unknown command " + args[0]);
			}
		} catch(err) {
			console.log("Invalid command", err);
		}
	}
}
module.exports.parseArgs(args);