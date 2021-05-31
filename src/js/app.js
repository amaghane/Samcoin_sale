App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading:false,
    tokenPrice: "50000000000000000",
    tokenSold: 0,
    tokensAvailable: 75000,

    init: function () {
        console.log("App initialized...")
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }

        return App.initContracts();
    },

    initContracts: function () {
        $.getJSON("SamcoinSale.json", function(samcoinsale) {
            App.contracts.SamcoinSale = TruffleContract(samcoinsale)
            App.contracts.SamcoinSale.setProvider(App.web3Provider);
            App.contracts.SamcoinSale.deployed().then(function(samcoinsale) {
                console.log("Samcoin Sale address", samcoinsale.address)
            });
        }).done(function() {
            $.getJSON("Samcoin.json", function(samcoin) {
                App.contracts.Samcoin = TruffleContract(samcoin)
                App.contracts.Samcoin.setProvider(App.web3Provider);
                App.contracts.Samcoin.deployed().then(function(samcoin) {
                console.log("Samcoin address", samcoin.address)
                });

                App.listenForEvents();
                return App.render();
            });
        })
    },

    listenForEvents: function () {
        App.contracts.SamcoinSale.deployed().then(function(instance) {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function(error, event) {
                console.log("event triggered", event);
                App.render()
            })
        })
    },

    render: function () {
        if (App.loading) {
            return;
        }
        App.loading = true;

        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();

        web3.eth.getCoinbase(function(err, account) {
            if(err === null) {
                App.account = account;
                $('#accountAddress').html('Your Account: ' + account);
            }
        })

        App.contracts.SamcoinSale.deployed().then(function(instance) {
            samcoinsaleInstance = instance;
            return samcoinsaleInstance.tokenPrice();
        }).then(function(tokenPrice){
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice, 'ether').toNumber());
            return samcoinsaleInstance.tokenSold();    
        }).then(function(tokenSold) {
            App.tokenSold = tokenSold.toNumber();
            $('.tokens-sold').html(App.tokenSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokenSold) / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            App.contracts.Samcoin.deployed().then(function(instance) {
                samcoinInstance = instance;
                return samcoinInstance.balanceOf(App.account)
            }).then(function(balance) {
                $('.sam-balance').html(balance.toNumber());
    
        App.loading = false;
        loader.hide();
        content.show();

            })
        });
    },

    buyTokens: function() {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.SamcoinSale.deployed().then(function(instance) {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000
            });
        }).then(function(result) {
            console.log("Tokens bought ...")
            $('form').trigger('reset')
            // Wait for Sell event
        })
    }
}

$(function() {
    $(window).load(function() {
        App.init();
    })
})