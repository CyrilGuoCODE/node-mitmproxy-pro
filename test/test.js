const mitmproxy = require('../lib');

process.on('uncaughtException', (error) => {
    if (error.code === 'ECONNRESET') {
        console.log('网络连接被重置，这可能是因为远程服务器主动关闭了连接');
        return;
    }

    console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
    if (reason.code === 'ECONNRESET') {
        console.log('网络连接被重置，这可能是因为远程服务器主动关闭了连接');
        return;
    }
    console.error(reason);
});

mitmproxy.createProxy({
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (id, rOptions, req, res, proxyReq, ssl, next) => {
        console.log(`\n========== 请求信息 ==========`);
        console.log(`URL: ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.path} METHOD: ${rOptions.method}`);
        // console.log(`\n--- 请求头 ---`);
        // console.log(rOptions.headers);
        
        // 捕获请求体
        let requestBody = [];
        req.on('data', chunk => {
            // proxyReq.write(chunk);
            requestBody.push(chunk)
        });
        req.on('end', () => {
            // proxyReq.end();
            const body = Buffer.concat(requestBody).toString();
            if (body) {
                console.log(`\n--- 请求体 ---`);
                console.log(body);
            }
        });
        req.pipe(proxyReq);
        next();
    },
    responseInterceptor: (id, res, proxyRes, ssl, next) => {
        // console.log(`\n========== 响应信息 ==========`);
        // console.log(`\n--- 响应头 ---`);
        // console.log(proxyRes.headers);
        
        // 捕获响应体
        let responseBody = [];
        proxyRes.on('data', chunk => responseBody.push(chunk));
        proxyRes.on('end', () => {
            const body = Buffer.concat(responseBody).toString();
            // console.log(`\n--- 响应体 ---`);
            // console.log(body);
        });
        
        next();
    }
});
