const SamcoinSale = artifacts.require("SamcoinSale");
const Samcoin = artifacts.require("Samcoin");

// require('chai')
//   .use(require('chai-as-promised'))
//   .should()

contract('SamcoinSale', ([admin, buyer]) => {

    before(async () => {
        samcoin = await Samcoin.deployed();
        samcoinsale = await SamcoinSale.deployed();
        tokenPrice = "50000000000000000";
        tokensToSell = 100;
        numberOfTokens = 10;
        value = numberOfTokens * tokenPrice;
        address = samcoinsale.address;
        transferReceipt = await samcoin.transfer(address, tokensToSell, {from: admin});       
      })

    describe('initializes the contract with the correct values', async () => {

        it('has an address', async () => {
            const address = await samcoinsale.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a tokenContract', async () => {
            const address = await samcoinsale.tokenContract()
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has the correct price', async () => {
            const price = await samcoinsale.tokenPrice()
            assert.equal(price, tokenPrice)
        })

    })

    describe('Buying tokens functions', async () => {

        it('facilitates tokens buying', async () => {
            receipt = await samcoinsale.buyTokens(numberOfTokens, {from: buyer, value: value});
            amount = await samcoinsale.tokenSold()
            assert.equal(amount, numberOfTokens)
        })

        it('triggers a sell Event', async () => {
            const value = numberOfTokens * tokenPrice;
            assert.equal(receipt.logs.length, 1)
            assert.equal(receipt.logs[0].event, 'Sell')
            assert.equal(receipt.logs[0].args._buyer, buyer)
            assert.equal(receipt.logs[0].args._amount, numberOfTokens)
        }) 
        
        it('buys the correct amount of tokens', async () => {
            try {
                receipt = await samcoinsale.buyTokens(numberOfTokens, {from: buyer, value: 1})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }
        })
        
        it('does not let anyone buy more tokens than available', async () => {
            try {
                receipt = await samcoinsale.buyTokens(numberOfTokens, {from: buyer, value: 110 * tokenPrice})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }
        })

        it('transfers the tokens', async () => {
            const tokensBuyer = await samcoin.balanceOf(buyer)
            assert.equal(tokensBuyer.toNumber(), numberOfTokens)
            const tokensOnContract = await samcoin.balanceOf(address)
            assert.equal(tokensOnContract.toNumber(), tokensToSell - numberOfTokens)
        })

    })

    describe('End of tokens Sale', async () => {

        it('prevents  other accounts to end sale', async () => {
            try {
                receipt = await samcoinsale.endSale({from: buyer})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }
        })

        it('allows admin to end sale', async () => {
            receipt = await samcoinsale.endSale({from: admin})
            balance = await samcoin.balanceOf(admin)
            assert.equal(balance.toNumber(), 99990)
            
        })

        it('destroys the contract', async () => {
            try {
                price = await samcoinsale.tokenPrice()
            } catch (error) {
                assert(error.message.indexOf('error')>= 0, 'must be an error');
            }
        })
    
    })

})