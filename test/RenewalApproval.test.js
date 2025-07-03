const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RenewalApproval", function () {
    let LandRegistry;
    let RenewalApproval;
    let landRegistry;
    let renewalApproval;
    let owner;
    let agent;
    let admin;
    let user1;

    const AGENT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AGENT_ROLE"));
    const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

    beforeEach(async function () {
        [owner, agent, admin, user1] = await ethers.getSigners();

        // 部署主合约
        LandRegistry = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistry.deploy();
        await landRegistry.deployed();

        // 部署续期合约
        RenewalApproval = await ethers.getContractFactory("RenewalApproval");
        renewalApproval = await RenewalApproval.deploy(landRegistry.address);
        await renewalApproval.deployed();

        // 设置角色
        await landRegistry.grantRole(AGENT_ROLE, agent.address);
        await landRegistry.grantRole(ADMIN_ROLE, admin.address);
        await renewalApproval.grantRole(AGENT_ROLE, agent.address);
        await renewalApproval.grantRole(ADMIN_ROLE, admin.address);

        // 设置合约间的权限
        await landRegistry.grantRole(ADMIN_ROLE, renewalApproval.address);

        // 注册测试房产
        const testFolio = "NSW-123";
        const testIpfsHash = "QmTest123";
        const expiryTime = (await time.latest()) + 365 * 24 * 60 * 60;
        await landRegistry.connect(agent).registerProperty(
            testFolio,
            user1.address,
            testIpfsHash,
            expiryTime
        );
    });

    describe("Renewal Request", function () {
        const testFolio = "NSW-123";
        let newExpiryTime;

        beforeEach(async function () {
            newExpiryTime = (await time.latest()) + 2 * 365 * 24 * 60 * 60; // 2 years from now
        });

        it("Should allow agent to create renewal request", async function () {
            const tx = await renewalApproval.connect(agent).requestRenewal(
                testFolio,
                newExpiryTime,
                "Regular renewal request"
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "RenewalRequested");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.requester).to.equal(agent.address);

            const request = await renewalApproval.getRenewalRequest(testFolio);
            expect(request.requester).to.equal(agent.address);
            expect(request.approved).to.be.false;
            expect(request.newExpiryTime).to.equal(newExpiryTime);
        });

        it("Should not allow non-agent to create renewal request", async function () {
            await expect(
                renewalApproval.connect(user1).requestRenewal(
                    testFolio,
                    newExpiryTime,
                    "Unauthorized request"
                )
            ).to.be.revertedWith("AccessControlUnauthorizedAccount");
        });

        it("Should allow admin to approve renewal request", async function () {
            await renewalApproval.connect(agent).requestRenewal(
                testFolio,
                newExpiryTime,
                "Regular renewal request"
            );

            const tx = await renewalApproval.connect(admin).approveRenewal(
                testFolio,
                true,
                ""
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "RenewalApproved");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.newExpiryTime).to.equal(newExpiryTime);

            const request = await renewalApproval.getRenewalRequest(testFolio);
            expect(request.approved).to.be.true;

            // 验证主合约中的到期时间已更新
            const property = await landRegistry.getProperty(testFolio);
            expect(property.expiryTimestamp).to.equal(newExpiryTime);
        });

        it("Should allow admin to reject renewal request", async function () {
            await renewalApproval.connect(agent).requestRenewal(
                testFolio,
                newExpiryTime,
                "Regular renewal request"
            );

            const rejectionReason = "Invalid renewal period";
            const tx = await renewalApproval.connect(admin).approveRenewal(
                testFolio,
                false,
                rejectionReason
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "RenewalRejected");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.reason).to.equal(rejectionReason);

            // 验证请求已被删除
            await expect(
                renewalApproval.getRenewalRequest(testFolio)
            ).to.be.revertedWith("No renewal request found");
        });

        it("Should maintain renewal history", async function () {
            await renewalApproval.connect(agent).requestRenewal(
                testFolio,
                newExpiryTime,
                "First renewal request"
            );

            await renewalApproval.connect(admin).approveRenewal(
                testFolio,
                true,
                ""
            );

            const history = await renewalApproval.getRenewalHistory(testFolio);
            expect(history.length).to.equal(1);
            expect(history[0].folioNumber).to.equal(testFolio);
            expect(history[0].approved).to.be.true;
            expect(history[0].newExpiryTime).to.equal(newExpiryTime);
        });
    });
}); 