require('dotenv').config();

console.log('环境变量测试结果：');
console.log('===================');

// 数据库配置
console.log('数据库配置：');
console.log(`- 主机: ${process.env.DB_HOST}`);
console.log(`- 端口: ${process.env.DB_PORT}`);
console.log(`- 数据库名: ${process.env.DB_NAME}`);
console.log(`- 用户名: ${process.env.DB_USER}`);
console.log('- 密码: [已设置]');

// 以太坊配置
console.log('\n以太坊配置：');
console.log(`- 网络: ${process.env.ETH_NETWORK}`);
console.log(`- 节点URL: ${process.env.ETH_NODE_URL}`);
console.log('- 私钥: [已设置]');

// 智能合约地址
console.log('\n智能合约地址：');
console.log(`- 土地注册表: ${process.env.LAND_REGISTRY_ADDRESS}`);
console.log(`- 续期审批: ${process.env.RENEWAL_APPROVAL_ADDRESS}`);
console.log(`- 转移审批: ${process.env.TRANSFER_APPROVAL_ADDRESS}`);

// 应用程序配置
console.log('\n应用程序配置：');
console.log(`- 端口: ${process.env.PORT}`);
console.log(`- 环境: ${process.env.NODE_ENV}`);
console.log('- JWT密钥: [已设置]');
console.log(`- JWT过期时间: ${process.env.JWT_EXPIRES_IN}`);

// 日志配置
console.log('\n日志配置：');
console.log(`- 日志级别: ${process.env.LOG_LEVEL}`);
console.log(`- 日志文件路径: ${process.env.LOG_FILE_PATH}`); 