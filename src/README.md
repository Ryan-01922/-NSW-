# NSW Land Registry Frontend

这是 NSW 土地注册系统的前端界面。本项目使用 Express.js 作为静态文件服务器，并通过 Web3.js 与以太坊智能合约交互。

## 环境要求

- Node.js (v14.0.0 或更高版本)
- npm (v6.0.0 或更高版本)
- MetaMask 浏览器插件

## 安装步骤

1. 安装项目依赖：
```bash
npm install
```

2. 安装前端所需的额外依赖：
```bash
npm install web3 bootstrap@5.3.0
```

## 运行项目

1. 确保已经部署了智能合约：
```bash
npx hardhat run scripts/deploy.js --network <your-network>
```

2. 启动前端服务器：
```bash
npm start
```

3. 在浏览器中访问：
```
http://localhost:3000
```

## 使用说明

1. 确保 MetaMask 已经安装并连接到正确的网络
2. 根据您的角色（用户、代理人、管理员）使用相应的功能：
   - 用户：查看房产信息
   - 代理人：注册房产、发起转让和续期请求
   - 管理员：审批转让和续期请求

## 注意事项

- 首次使用时需要连接 MetaMask 钱包
- 确保您的 MetaMask 连接到正确的网络（开发环境通常是本地网络或测试网）
- 代理人和管理员角色需要特殊权限，请联系系统管理员获取 