const { expect } = require("chai");
const {tokens} = require("./helpers")

describe("Token", () => {
  const name = 'Dapp Token'
  const symbol = 'DAPP';
  const decimals = 18;
  const totalSupply = tokens(1000000);


  let token;
  beforeEach(async () =>{
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();
  })

  describe('Deployment', () => {
    it("should have a name ", async() =>{
      const name = await token.name();
      // assert(name).should.equal('My Name');
      expect(name).to.equal(name)
    })

    it("should have a symbol", async () =>{
      const result = await token.symbol();
      expect(result).to.equal(symbol)
    })

    it('should have decimals', async () =>{
      const result = await token.decimals();
      expect(result).to.equal(decimals);
    })

    it("should have a total supply", async () =>{
      const result = await token.totalSupply()
      expect(result).to.equal(totalSupply)
    })

    it("Should assign the total supply to the deployer", async () => {
      const [adds,_] = await ethers.getSigners()
      const result = await token.balanceOf(adds.address)
      expect(result).to.equal(totalSupply)
    })
  })

  describe('Sending tokens', () => {
    let amount, result, deployer, receiver;
    beforeEach(async () => {
      [deployer,receiver, _] = await ethers.getSigners()
      amount = tokens(100)
      result = await token.transfer(receiver.address, amount, {from: deployer.address})
    })
    it('should transfer balances', async () =>{
      let balanceOf
      balanceOf = await token.balanceOf(deployer.address)
      // After transfer
      balanceOf = await token.balanceOf(deployer.address)
      expect(balanceOf.toString()).to.equal(tokens(999900).toString())
      balanceOf = await token.balanceOf(receiver.address)
      expect(balanceOf.toString()).to.equal(tokens(100).toString())

    })

    it("should emit a transfer event", async () =>{
      expect(result)
        .to.emit(token,'Transfer')
        .withArgs(deployer.address, receiver.address, amount)
    })
  })

  describe('failure', async () =>{
    let amount, result, deployer, receiver;
    beforeEach(async () => {
      [deployer,receiver, _] = await ethers.getSigners()
      amount = tokens(100)
    })

    it("Should reject insufficient balances", async () => {
      let invalidAmount;
      invalidAmount = tokens(1000000000)
      await expect(
        token.transfer(
          receiver.address, invalidAmount, {from: deployer.address}
        )
      ).to.be.revertedWith("Not enough tokens");
      let balanceOf = await token.balanceOf(receiver.address)
      console.log("Rec Balan", balanceOf.toString())

      balanceOf = await token.balanceOf(deployer.address)
      console.log("deployer Balan", balanceOf.toString())
      invalidAmount = tokens(1000000000);
      await expect(
        token.connect(receiver).transfer(
          deployer.address, invalidAmount, {from: receiver.address}
        )
      ).to.be.revertedWith("Not enough tokens")
    })

    it("Should reject invalid addresses", async () => {
      await expect(token.transfer("0x0", amount, {from: deployer.address}))
        .to.be.reverted
    })

  })

  describe('Approving tokens', () => {
    let result, amount, deployer,receiver, exchange;
    beforeEach(async () => {
      [deployer,receiver, exchange, _] = await ethers.getSigners()
      amount = tokens(100)
      result = await token.approve(exchange.address, amount,{from: deployer.address})
    })
    describe('Success case', () =>{

      it('should allocate an allowance for delegated token spending on exchange', async () => {
        const allowance = await token.allowance(deployer.address, exchange.address)
        expect(allowance.toString()).to.eq(amount.toString())
      })

      it("should emit an approval event", async () =>{
        expect(result)
          .to.emit(token,'Approval')
          .withArgs(deployer.address, exchange.address, amount)
      })

    })

    describe('Failure case', () =>{
      it("Should reject invalid addresses", async () => {
        await expect(token.approve("0x0", amount, {from: deployer.address}))
          .to.be.reverted
      })
    })
  })

})