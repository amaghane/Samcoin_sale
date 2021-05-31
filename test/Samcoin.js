const Samcoin = artifacts.require('Samcoin');

// require('chai')
//   .use(require('chai-as-promised'))
//   .should()

contract('Samcoin', ([deployer, receiver, fromA, toA, spendingA]) => {

    before(async () => {
        samcoin = await Samcoin.deployed()
      })

    describe('deployment', async () => {

        it('deploys successfully', async () => {
            const address = await samcoin.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name and a symbol and a standard', async () => {
            const name = await samcoin.name()
            const symbol = await samcoin.symbol()
            const standard = await samcoin.standard()
            assert.equal(name, 'Samcoin')
            assert.equal(symbol, 'SAM')
            assert.equal('Samcoin v1.0', 'Samcoin v1.0')
        })

        it('set the total number of tokens correctly', async () => {
            const totalSupply = await samcoin.totalSupply()
            assert.equal(totalSupply.toNumber(), 100000)
        })

        it('allocates the total supply to the deployer', async () => {
            const deployerBalance = await samcoin.balanceOf(deployer)
            const receiverBalance = await samcoin.balanceOf(receiver)
            assert.equal(deployerBalance.toNumber(), 100000)
            assert.equal(receiverBalance.toNumber(), 0)
        })

    })

    describe('functions transfer', async () => {

        it('throws an exception when balance is too small', async () => {

            try {
                await samcoin.transfer.call(receiver, 200000, {from: deployer})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }

        })

        it('triggers the expected event', async () => {

            receipt = await samcoin.transfer(receiver, 0, {from: deployer});

            assert.equal(receipt.logs.length, 1)
            assert.equal(receipt.logs[0].event, 'Transfer')
            assert.equal(receipt.logs[0].args._from, deployer)
            assert.equal(receipt.logs[0].args._to, receiver)
            assert.equal(receipt.logs[0].args._value, 0)
        })

        it('returns true when called', async () => {

            success = await samcoin.transfer.call(receiver, 0, {from: deployer});

            assert.equal(success, true)
        })

        it('transfers tokens accordingly', async () => {

            samcoin.transfer(receiver, 10000, {from: deployer})

            const deployerBalance = await samcoin.balanceOf(deployer)
            const receiverBalance = await samcoin.balanceOf(receiver)

            assert.equal(deployerBalance.toNumber(), 90000)
            assert.equal(receiverBalance.toNumber(), 10000)

        })

    })

    describe('functions delegated transfer', async () => {

        it('approves contract B to spend tokens on behalf of sender', async () => {

            approval = await samcoin.approve.call(receiver, 100, {from: deployer});
            assert.equal(approval, true) 
        })

        it('triggers the expected event', async () => {

            receipt = await samcoin.approve(receiver, 100, {from: deployer});

            assert.equal(receipt.logs.length, 1)
            assert.equal(receipt.logs[0].event, 'Approval')
            assert.equal(receipt.logs[0].args._owner, deployer)
            assert.equal(receipt.logs[0].args._spender, receiver)
            assert.equal(receipt.logs[0].args._value, 100)
        })

        it('returns true when approve is called', async () => {

            success = await samcoin.approve.call(receiver, 100, {from: deployer});

            assert.equal(success, true)
        })

        it('updates the allowance', async () => {

            samcoin.approve(receiver, 100, {from: deployer});

            allowance = await samcoin.allowance(deployer, receiver)

            assert.equal(allowance.toNumber(), 100)
        })

        it('throws an exception when balance is too small', async () => {

            fromAccount = fromA // origin of the tokens sent
            toAccount = toA // sending tokens to an account
            spendingAccount = spendingA // Contract approved to use the tokens

            receipt = await samcoin.transfer(fromAccount, 100, {from: deployer})
            receipt = await samcoin.approve(spendingAccount, 200, {from: fromAccount})

            // spend 150
            try {
                await samcoin.transferFrom(fromAccount, toAccount, 150, {from: spendingAccount})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }

        })

        it('throws an exception when contracts try to spend more than allowed', async () => {

            receipt = await samcoin.transfer(fromAccount, 100, {from: deployer})
            receipt = await samcoin.approve(spendingAccount, 10, {from: fromAccount})

            // spend 20 
            try {
                await samcoin.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount})
            } catch (error) {
                assert(error.message.indexOf('revert')>= 0, 'error must contain revert');
            }

        })

        it('handles delegated transfers', async () => {

            receipt = await samcoin.transfer(fromAccount, 100, {from: deployer})
            receipt = await samcoin.approve(spendingAccount, 10, {from: fromAccount})

            receipt = await samcoin.transferFrom(fromAccount, toAccount, 6, {from: spendingAccount})

            const fromAccountBalance = await samcoin.balanceOf(fromAccount)
            const toAccountBalance = await samcoin.balanceOf(toAccount)
            
            assert.equal(fromAccountBalance.toNumber(), 294)
            assert.equal(toAccountBalance.toNumber(), 6)

            allowance = await samcoin.allowance(fromAccount, spendingAccount)

            assert.equal(allowance.toNumber(), 4)
        })

        it('triggers the transfer event', async () => {

            receipt = await samcoin.transferFrom(fromAccount, toAccount, 1, {from: spendingAccount});

            assert.equal(receipt.logs.length, 1)
            assert.equal(receipt.logs[0].event, 'Transfer')
            assert.equal(receipt.logs[0].args._from, fromAccount)
            assert.equal(receipt.logs[0].args._to, toAccount)
            assert.equal(receipt.logs[0].args._value, 1)
        })

        it('returns true when transferfrom is called', async () => {

            success = await samcoin.transferFrom.call(fromAccount, toAccount, 0, {from: spendingAccount});

            assert.equal(success, true)
        })

    })

})