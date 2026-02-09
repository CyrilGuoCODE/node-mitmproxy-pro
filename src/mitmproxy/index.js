const tlsUtils = require('../tls/tlsUtils');
const http = require('http');
const config = require('../common/config');
const colors = require('colors');
const createRequestHandler = require('./createRequestHandler');
const createConnectHandler = require('./createConnectHandler');
const createFakeServerCenter = require('./createFakeServerCenter');
const createUpgradeHandler = require('./createUpgradeHandler');


module.exports = {
    /**
     * 启动中间人代理服务器
     * @param {Object} options 配置
     * @param {Number} options.port 代理端口
     * @param {String} options.caCertPath CA证书路径
     * @param {String} options.caKeyPath CA私钥路径
     * @param {Function} options.sslConnectInterceptor SSL连接拦截器
     * @param {Function} options.requestInterceptor 请求拦截器
     * @param {Function} options.responseInterceptor 响应拦截器
     * @param {Number} options.getCertSocketTimeout 获取证书超时时间
     * @param {Array} options.middlewares 中间件
     * @param {Object} options.externalProxy 外部代理
     * @returns {http.Server} http代理服务器（关闭请使用.close()方法）
     */
    createProxy({
        port = config.defaultPort,
        caCertPath,
        caKeyPath,
        sslConnectInterceptor,
        requestInterceptor,
        responseInterceptor,
        getCertSocketTimeout = 1 * 1000,
        middlewares = [],
        externalProxy
    }) {

        // Don't reject unauthorized
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

        if (!caCertPath && !caKeyPath) {
            var rs = this.createCA();
            caCertPath = rs.caCertPath;
            caKeyPath = rs.caKeyPath;
            if (rs.create) {
                console.log(colors.cyan(`CA Cert saved in: ${caCertPath}`));
                console.log(colors.cyan(`CA private key saved in: ${caKeyPath}`));
            }
        }

        port = ~~port;
        var requestHandler = createRequestHandler(
            requestInterceptor,
            responseInterceptor,
            middlewares,
            externalProxy
        );

        var upgradeHandler = createUpgradeHandler();

        var fakeServersCenter = createFakeServerCenter({
            caCertPath,
            caKeyPath,
            requestHandler,
            upgradeHandler,
            getCertSocketTimeout
        });

        var connectHandler = createConnectHandler(
            sslConnectInterceptor,
            fakeServersCenter
        );

        var server = new http.Server();
        server.listen(port, () => {
            console.log(colors.green(`node-mitmproxy启动端口: ${port}`));
            server.on('error', (e) => {
                console.error(colors.red(e));
            });
            server.on('request', (req, res) => {
                var ssl = false;
                requestHandler(req, res, ssl);
            });
            // tunneling for https
            server.on('connect', (req, cltSocket, head) => {
                connectHandler(req, cltSocket, head);
            });
            // TODO: handler WebSocket
            server.on('upgrade', function(req, socket, head) {
                var ssl = false;
                upgradeHandler(req, socket, head, ssl);
            });
        });

        return server;
    },
    // 创建CA证书
    createCA(caBasePath = config.getDefaultCABasePath()) {
        return tlsUtils.initCA(caBasePath);
    }
}
