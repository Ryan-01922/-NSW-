// 合约地址 - 需要在部署后更新
const LAND_REGISTRY_ADDRESS = '你的LandRegistry合约地址';
const RENEWAL_APPROVAL_ADDRESS = '你的RenewalApproval合约地址';
const TRANSFER_APPROVAL_ADDRESS = '你的TransferApproval合约地址';

// 合约 ABI
const LAND_REGISTRY_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "folioNumber",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        }
      ],
      "name": "PropertyRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "folioNumber",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "expiryTime",
          "type": "uint256"
        }
      ],
      "name": "registerProperty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

let web3;
let accounts;
let landRegistryContract;
let renewalApprovalContract;
let transferApprovalContract;
let userRole = null;

// 初始化 Web3
async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        try {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            document.getElementById('walletAddress').textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            
            // 初始化合约
            landRegistryContract = new web3.eth.Contract(LAND_REGISTRY_ABI, LAND_REGISTRY_ADDRESS);
            renewalApprovalContract = new web3.eth.Contract(RENEWAL_APPROVAL_ABI, RENEWAL_APPROVAL_ADDRESS);
            transferApprovalContract = new web3.eth.Contract(TRANSFER_APPROVAL_ABI, TRANSFER_APPROVAL_ADDRESS);

            // 检查用户角色
            await checkUserRole();
            
            // 根据角色显示相应功能
            showFunctionsByRole();
            
            // 加载相应数据
            await loadData();
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        console.error("Please install MetaMask!");
    }
}

// 检查用户角色
async function checkUserRole() {
    try {
        const isAgent = await landRegistryContract.methods.hasRole(AGENT_ROLE, accounts[0]).call();
        const isAdmin = await landRegistryContract.methods.hasRole(ADMIN_ROLE, accounts[0]).call();
        
        if (isAdmin) {
            userRole = 'admin';
        } else if (isAgent) {
            userRole = 'agent';
        } else {
            userRole = 'user';
        }
        
        document.getElementById('roleInfo').textContent = `Current role: ${userRole}`;
    } catch (error) {
        console.error("Error checking role:", error);
    }
}

// 根据角色显示功能
function showFunctionsByRole() {
    document.getElementById('userSection').classList.add('d-none');
    document.getElementById('agentSection').classList.add('d-none');
    document.getElementById('adminSection').classList.add('d-none');
    
    switch(userRole) {
        case 'user':
            document.getElementById('userSection').classList.remove('d-none');
            loadUserData();
            break;
        case 'agent':
            document.getElementById('agentSection').classList.remove('d-none');
            loadAgentData();
            break;
        case 'admin':
            document.getElementById('adminSection').classList.remove('d-none');
            loadAdminData();
            break;
    }
}

// 用户功能
async function loadUserData() {
    await loadUserProperties();
    await loadAuthorizedAgents();
}

async function loadUserProperties() {
    try {
        // 这里需要实现获取用户房产列表的逻辑
        const propertyList = document.getElementById('propertyList');
        // 示例：
        propertyList.innerHTML = '<div class="alert alert-info">加载房产列表中...</div>';
    } catch (error) {
        console.error("Error loading properties:", error);
    }
}

// 代理人功能
async function loadAgentData() {
    // 加载代理人的操作历史
    const agentHistory = document.getElementById('agentHistory');
    agentHistory.innerHTML = '<div class="alert alert-info">加载历史记录中...</div>';
}

// 管理员功能
async function loadAdminData() {
    await loadPendingRenewals();
    await loadPendingTransfers();
    await loadSystemStatus();
    await loadExistingRoles();
    await loadRoleApplications();
}

// IPFS 文件上传
async function uploadToIPFS(file) {
    // 这里需要实现 IPFS 上传逻辑
    return "ipfs-hash";
}

// 角色管理相关函数
async function grantRole(address, role) {
    try {
        const roleHash = role === 'agent' ? AGENT_ROLE : ADMIN_ROLE;
        await landRegistryContract.methods.grantRole(roleHash, address)
            .send({ from: accounts[0] });
        alert('Role granted successfully!');
        await loadExistingRoles();
    } catch (error) {
        console.error("Error granting role:", error);
        alert('Failed to grant role: ' + error.message);
    }
}

async function revokeRole(address, role) {
    try {
        const roleHash = role === 'agent' ? AGENT_ROLE : ADMIN_ROLE;
        await landRegistryContract.methods.revokeRole(roleHash, address)
            .send({ from: accounts[0] });
        alert('Role revoked successfully!');
        await loadExistingRoles();
    } catch (error) {
        console.error("Error revoking role:", error);
        alert('Failed to revoke role: ' + error.message);
    }
}

async function loadExistingRoles() {
    try {
        const rolesList = document.getElementById('existingRoles');
        rolesList.innerHTML = '<div class="spinner-border" role="status"></div>';

        // 获取所有角色事件
        const agentEvents = await landRegistryContract.getPastEvents('RoleGranted', {
            filter: { role: AGENT_ROLE },
            fromBlock: 0
        });
        const adminEvents = await landRegistryContract.getPastEvents('RoleGranted', {
            filter: { role: ADMIN_ROLE },
            fromBlock: 0
        });

        // 构建当前角色列表
        const roles = new Map();
        for (const event of [...agentEvents, ...adminEvents]) {
            const address = event.returnValues.account;
            const role = event.returnValues.role === AGENT_ROLE ? 'agent' : 'admin';
            if (!roles.has(address)) {
                roles.set(address, new Set());
            }
            roles.get(address).add(role);
        }

        // 显示角色列表
        let html = '<table class="table"><thead><tr><th>Address</th><th>Role</th></tr></thead><tbody>';
        for (const [address, userRoles] of roles) {
            html += `<tr>
                <td>${address}</td>
                <td>${Array.from(userRoles).join(', ')}</td>
            </tr>`;
        }
        html += '</tbody></table>';
        rolesList.innerHTML = html;
    } catch (error) {
        console.error("Error loading roles:", error);
        rolesList.innerHTML = '<div class="alert alert-danger">加载角色列表失败</div>';
    }
}

// 角色申请相关函数
async function submitRoleApplication() {
    const reason = document.getElementById('applicationReason').value;
    const file = document.getElementById('applicationDocument').files[0];

    try {
        const ipfsHash = await uploadToIPFS(file);
        
        const response = await fetch('/api/role-applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: accounts[0],
                role: 'agent',
                reason: reason,
                documentHash: ipfsHash
            })
        });

        if (response.ok) {
            alert('Application submitted successfully. Please wait for admin approval.');
            $('#roleApplicationModal').modal('hide');
        } else {
            throw new Error('Failed to submit application');
        }
    } catch (error) {
        console.error("Error submitting application:", error);
        alert('Failed to submit application: ' + error.message);
    }
}

// 加载角色申请列表
async function loadRoleApplications() {
    try {
        const response = await fetch('/api/role-applications');
        const applications = await response.json();
        
        const applicationsList = document.getElementById('roleApplications');
        let html = '<table class="table"><thead><tr><th>申请人</th><th>申请角色</th><th>申请原因</th><th>操作</th></tr></thead><tbody>';
        
        for (const app of applications) {
            html += `<tr>
                <td>${app.address}</td>
                <td>${app.role}</td>
                <td>${app.reason}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveApplication('${app.id}')">批准</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectApplication('${app.id}')">拒绝</button>
                </td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        applicationsList.innerHTML = html;
    } catch (error) {
        console.error("Error loading applications:", error);
        applicationsList.innerHTML = '<div class="alert alert-danger">加载申请列表失败</div>';
    }
}

// 事件监听器
document.getElementById('roleManagementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = document.getElementById('roleAddress').value;
    const role = document.getElementById('roleType').value;
    const action = document.getElementById('roleAction').value;

    if (action === 'grant') {
        await grantRole(address, role);
    } else {
        await revokeRole(address, role);
    }
});

document.getElementById('submitApplication').addEventListener('click', submitRoleApplication);

// 用户功能事件监听
document.getElementById('authorizeAgentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const agentAddress = document.getElementById('agentAddress').value;
    const folioNumber = document.getElementById('authorizeFolio').value;
    // 实现授权逻辑
});

// 代理人功能事件监听
document.getElementById('registerPropertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const folioNumber = document.getElementById('registerFolio').value;
    const ownerAddress = document.getElementById('ownerAddress').value;
    const file = document.getElementById('propertyFile').files[0];
    const expiryTime = new Date(document.getElementById('expiryTime').value).getTime() / 1000;
    
    try {
        const ipfsHash = await uploadToIPFS(file);
        await landRegistryContract.methods.registerProperty(
            folioNumber,
            ownerAddress,
            ipfsHash,
            expiryTime
        ).send({ from: accounts[0] });
        alert('Property registered successfully!');
    } catch (error) {
        console.error("Error registering property:", error);
        alert('Failed to register property: ' + error.message);
    }
});

document.getElementById('renewalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const folioNumber = document.getElementById('renewalFolio').value;
    const newExpiryTime = new Date(document.getElementById('newExpiryTime').value).getTime() / 1000;
    const reason = document.getElementById('renewalReason').value;
    
    try {
        await renewalApprovalContract.methods.requestRenewal(
            folioNumber,
            newExpiryTime,
            reason
        ).send({ from: accounts[0] });
        alert('续期申请已提交！');
    } catch (error) {
        console.error("Error requesting renewal:", error);
        alert('续期申请失败：' + error.message);
    }
});

document.getElementById('transferForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const folioNumber = document.getElementById('transferFolio').value;
    const newOwner = document.getElementById('newOwnerAddress').value;
    const reason = document.getElementById('transferReason').value;
    const file = document.getElementById('transferFile').files[0];
    
    try {
        const ipfsHash = await uploadToIPFS(file);
        await transferApprovalContract.methods.requestTransfer(
            folioNumber,
            newOwner,
            reason,
            ipfsHash
        ).send({ from: accounts[0] });
        alert('转移申请已提交！');
    } catch (error) {
        console.error("Error requesting transfer:", error);
        alert('转移申请失败：' + error.message);
    }
});

// 管理员功能事件监听
document.getElementById('propertyStatusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const folioNumber = document.getElementById('statusFolio').value;
    const active = document.getElementById('propertyActive').checked;
    
    try {
        await landRegistryContract.methods.setPropertyStatus(
            folioNumber,
            active
        ).send({ from: accounts[0] });
        alert('房产状态已更新！');
    } catch (error) {
        console.error("Error updating property status:", error);
        alert('状态更新失败：' + error.message);
    }
});

// 监听钱包账户变化
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        document.getElementById('walletAddress').textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
    });
} 