const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TransferApproval", function () {
    let LandRegistry;
    let TransferApproval;
    let landRegistry;
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

        // 部署主合约
        LandRegistry = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistry.deploy();
        await landRegistry.deployed();

        // 部署转移合约
        TransferApproval = await ethers.getContractFactory("TransferApproval");
        transferApproval = await TransferApproval.deploy(landRegistry.address);
        await transferApproval.deployed();

        // 设置角色
        await landRegistry.grantRole(AGENT_ROLE, agent.address);
        await landRegistry.grantRole(ADMIN_ROLE, admin.address);
        await transferApproval.grantRole(AGENT_ROLE, agent.address);
        await transferApproval.grantRole(ADMIN_ROLE, admin.address);

        // 设置合约间的权限
        await landRegistry.grantRole(ADMIN_ROLE, transferApproval.address);

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

    describe("Transfer Request", function () {
        const testFolio = "NSW-123";
        const testDocuments = "QmTransferDocs123";

        it("Should allow agent to create transfer request", async function () {
            const tx = await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "Regular transfer request",
                testDocuments
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "TransferRequested");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.from).to.equal(user1.address);
            expect(event.args.to).to.equal(user2.address);
            expect(event.args.requester).to.equal(agent.address);

            const request = await transferApproval.getTransferRequest(testFolio);
            expect(request.from).to.equal(user1.address);
            expect(request.to).to.equal(user2.address);
            expect(request.requester).to.equal(agent.address);
            expect(request.approved).to.be.false;
            expect(request.documents).to.equal(testDocuments);
        });

        it("Should not allow non-agent to create transfer request", async function () {
            await expect(
                transferApproval.connect(user1).requestTransfer(
                    testFolio,
                    user2.address,
                    "Unauthorized request",
                    testDocuments
                )
            ).to.be.revertedWith("AccessControlUnauthorizedAccount");
        });

        it("Should not allow transfer to current owner", async function () {
            await expect(
                transferApproval.connect(agent).requestTransfer(
                    testFolio,
                    user1.address,
                    "Invalid transfer to same owner",
                    testDocuments
                )
            ).to.be.revertedWith("New owner same as current owner");
        });

        it("Should allow admin to approve transfer request", async function () {
            // 首先在主合约中创建转移请求
            await landRegistry.connect(agent).requestTransfer(testFolio, user2.address);

            // 然后在转移合约中创建请求
            await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "Regular transfer request",
                testDocuments
            );

            const tx = await transferApproval.connect(admin).approveTransfer(
                testFolio,
                true,
                ""
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "TransferApproved");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.from).to.equal(user1.address);
            expect(event.args.to).to.equal(user2.address);

            // 验证所有权已转移
            const property = await landRegistry.getProperty(testFolio);
            expect(property.owner).to.equal(user2.address);
        });

        it("Should allow admin to reject transfer request", async function () {
            await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "Regular transfer request",
                testDocuments
            );

            const rejectionReason = "Invalid transfer documents";
            const tx = await transferApproval.connect(admin).approveTransfer(
                testFolio,
                false,
                rejectionReason
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "TransferRejected");

            expect(event.args.folioNumber).to.equal(testFolio);
            expect(event.args.reason).to.equal(rejectionReason);

            // 验证请求已被删除
            await expect(
                transferApproval.getTransferRequest(testFolio)
            ).to.be.revertedWith("No transfer request found");
        });

        it("Should allow requester to cancel transfer request", async function () {
            await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "Regular transfer request",
                testDocuments
            );

            await transferApproval.connect(agent).cancelTransferRequest(testFolio);

            // 验证请求已被删除
            await expect(
                transferApproval.getTransferRequest(testFolio)
            ).to.be.revertedWith("No transfer request found");
        });

        it("Should allow current owner to cancel transfer request", async function () {
            await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "Regular transfer request",
                testDocuments
            );

            await transferApproval.connect(user1).cancelTransferRequest(testFolio);

            // 验证请求已被删除
            await expect(
                transferApproval.getTransferRequest(testFolio)
            ).to.be.revertedWith("No transfer request found");
        });

        it("Should maintain transfer history", async function () {
            // 首先在主合约中创建转移请求
            await landRegistry.connect(agent).requestTransfer(testFolio, user2.address);

            // 然后在转移合约中创建请求
            await transferApproval.connect(agent).requestTransfer(
                testFolio,
                user2.address,
                "First transfer request",
                testDocuments
            );

            await transferApproval.connect(admin).approveTransfer(
                testFolio,
                true,
                ""
            );

            const history = await transferApproval.getTransferHistory(testFolio);
            expect(history.length).to.equal(1);
            expect(history[0].folioNumber).to.equal(testFolio);
            expect(history[0].from).to.equal(user1.address);
            expect(history[0].to).to.equal(user2.address);
            expect(history[0].approved).to.be.true;
            expect(history[0].documents).to.equal(testDocuments);
        });
    });
}); 