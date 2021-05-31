const Samcoin = artifacts.require("Samcoin");
const SamcoinSale = artifacts.require("SamcoinSale");

module.exports = function (deployer) {
  deployer.deploy(Samcoin, 100000).then(function() {
        var tokenPrice = "1000000000000000";
        return deployer.deploy(SamcoinSale, Samcoin.address, tokenPrice);
  })
};
