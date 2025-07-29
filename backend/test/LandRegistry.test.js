const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Land Registry System", function () {
    let LandRegistry;
    let RenewalApproval;
    let TransferApproval;
    let landRegistry;
    let renewalApproval;
    let transferApproval;
    let owner;
    let agent;
    let admin;
    let user1;
    let user2;

    const AGENT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AGENT_ROLE"));
    const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

    beforeEach(async function () {
        [owner, agent, admin, user1, user2] = await ethers.getSigners();

        // Deploy main contract
        LandRegistry = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistry.deploy();
        await landRegistry.deployed();

        // Deploy renewal contract
        RenewalApproval = await ethers.getContractFactory("RenewalApproval");
        renewalApproval = await RenewalApproval.deploy(landRegistry.address);
        await renewalApproval.deployed();

        // Deploy transfer contract
        TransferApproval = await ethers.getContractFactory("TransferApproval");
        transferApproval = await TransferApproval.deploy(landRegistry.address);
        await transferApproval.deployed();

        // Set up roles
        await landRegistry.grantRole(AGENT_ROLE, agent.address);
        await landRegistry.grantRole(ADMIN_ROLE, admin.address);
        await renewalApproval.grantRole(AGENT_ROLE, agent.address);
        await renewalApproval.grantRole(ADMIN_ROLE, admin.address);
        await transferApproval.grantRole(AGENT_ROLE, agent.address);
        await transferApproval.grantRole(ADMIN_ROLE, admin.address);

        // Set up inter-contract permissions
        await landRegistry.grantRole(ADMIN_ROLE, renewalApproval.address);
        await landRegistry.grantRole(ADMIN_ROLE, transferApproval.address);
    });

    describe("LandRegistry", function () {
        it("Should set the correct roles", async function () {
            expect(await landRegistry.hasRole(AGENT_ROLE, agent.address)).to.be.true;
            expect(await landRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
        });

        describe("Property Registration", function () {
            const testFolio = "NSW-123";
            const testIpfsHash = "QmTest123";
            let expiryTime;

            beforeEach(async function () {
                expiryTime = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year from now
            });

            it("Should allow agent to register property", async function () {
                const tx = await landRegistry.connect(agent).registerProperty(
                    testFolio,
                    user1.address,
                    testIpfsHash,
                    expiryTime
                );
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "PropertyRegistered");

                expect(event.args.folioNumber).to.equal(testFolio);
                expect(event.args.owner).to.equal(user1.address);
                expect(event.args.ipfsHash).to.equal(testIpfsHash);

                const property = await landRegistry.getProperty(testFolio);
                expect(property.owner).to.equal(user1.address);
                expect(property.ipfsHash).to.equal(testIpfsHash);
                expect(property.expiryTimestamp).to.equal(expiryTime);
                expect(property.active).to.be.true;
            });

            it("Should not allow non-agent to register property", async function () {
                await expect(
                    landRegistry.connect(user1).registerProperty(
                        testFolio,
                        user1.address,
                        testIpfsHash,
                        expiryTime
                    )
                ).to.be.revertedWith("AccessControlUnauthorizedAccount");
            });

            it("Should not allow duplicate registration", async function () {
                await landRegistry.connect(agent).registerProperty(
                    testFolio,
                    user1.address,
                    testIpfsHash,
                    expiryTime
                );

                await expect(
                    landRegistry.connect(agent).registerProperty(
                        testFolio,
                        user2.address,
                        testIpfsHash,
                        expiryTime
                    )
                ).to.be.revertedWith("Property already registered");
            });
        });

        describe("Property Transfer", function () {
            const testFolio = "NSW-123";
            const testIpfsHash = "QmTest123";
            let expiryTime;

            beforeEach(async function () {
                expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
                await landRegistry.connect(agent).registerProperty(
                    testFolio,
                    user1.address,
                    testIpfsHash,
                    expiryTime
                );
            });

            it("Should allow agent to request transfer", async function () {
                const tx = await landRegistry.connect(agent).requestTransfer(testFolio, user2.address);
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "TransferRequested");
                
                expect(event.args.folioNumber).to.equal(testFolio);
                expect(event.args.from).to.equal(user1.address);
                expect(event.args.to).to.equal(user2.address);
            });

            it("Should allow admin to approve transfer", async function () {
                await landRegistry.connect(agent).requestTransfer(testFolio, user2.address);
                
                const tx = await landRegistry.connect(admin).approveTransfer(testFolio);
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "TransferApproved");
                
                expect(event.args.folioNumber).to.equal(testFolio);
                expect(event.args.from).to.equal(user1.address);
                expect(event.args.to).to.equal(user2.address);

                const property = await landRegistry.getProperty(testFolio);
                expect(property.owner).to.equal(user2.address);
            });

            it("Should not allow transfer of inactive property", async function () {
                await landRegistry.connect(admin).setPropertyStatus(testFolio, false);
                
                await expect(
                    landRegistry.connect(agent).requestTransfer(testFolio, user2.address)
                ).to.be.revertedWith("Property not active");
            });
        });

        describe("Property Renewal", function () {
            const testFolio = "NSW-123";
            const testIpfsHash = "QmTest123";
            let expiryTime;

            beforeEach(async function () {
                expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
                await landRegistry.connect(agent).registerProperty(
                    testFolio,
                    user1.address,
                    testIpfsHash,
                    expiryTime
                );
            });

            it("Should allow agent to request renewal", async function () {
                const tx = await landRegistry.connect(agent).requestRenewal(testFolio);
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "RenewalRequested");
                
                expect(event.args.folioNumber).to.equal(testFolio);
                expect(event.args.requester).to.equal(agent.address);
            });

            it("Should allow admin to approve renewal", async function () {
                await landRegistry.connect(agent).requestRenewal(testFolio);
                const newExpiryTime = expiryTime + 365 * 24 * 60 * 60;
                
                const tx = await landRegistry.connect(admin).approveRenewal(testFolio, newExpiryTime);
                const receipt = await tx.wait();
                const event = receipt.events.find(e => e.event === "RenewalApproved");
                
                expect(event.args.folioNumber).to.equal(testFolio);
                expect(event.args.newExpiryTime).to.equal(newExpiryTime);

                const property = await landRegistry.getProperty(testFolio);
                expect(property.expiryTimestamp).to.equal(newExpiryTime);
            });
        });
    });
}); 