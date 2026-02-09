# node-mitmproxy-pro

**注意**: 此项目由node-mitmproxy修改而来  
原项目地址：https://github.com/wuchangming/node-mitmproxy  
官网：https://www.npmjs.com/package/node-mitmproxy

[![npm](https://img.shields.io/npm/dt/node-mitmproxy-pro.svg)](https://www.npmjs.com/package/node-mitmproxy-pro)  
node-mitmproxy-pro是一个基于nodejs，支持http/https的中间人(MITM)代理，便于渗透测试和开发调试。

## 1、特性
1、支持https  
2、支持配置的方式启动，也支持以模块的方式引入到代码中

## 2、安装

###### windows
```
    npm install node-mitmproxy-pro -g
```
###### Mac
```
    sudo npm install node-mitmproxy-pro -g
```

## 3、使用

#### 关于配置文件

###### 简单配置：

simpleConfig.js
```
module.exports = {
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (requestId, requestOptions, req, res, proxyReq, ssl, pipe) => {
        console.log(`正在访问：${requestOptions.protocol}//${requestOptions.hostname}:${requestOptions.port}`);
        console.log('cookie:', requestOptions.headers.cookie);
        res.end('hello node-mitmproxy-pro!');
        pipe();
    }
};

```
效果图：  
<img width=500 src="./doc/img/hello_node-mitmproxy.jpg" />

[详细配置说明](https://github.com/CyrilGuoCODE/node-mitmproxy-pro#4配置详细说明)  
[更多例子](./example/config/)
#### 启动方式
```
node-mitmproxy-pro -c simpleConfig.js
```

### 安装node-mitmproxy-pro CA根证书
生成CA根证书的默认路径：`%用户名%/node-mitmproxy-pro`

#### PC下安装根证书方式
###### Mac
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/node-mitmproxy-pro/node-mitmproxy-pro.ca.crt
```
###### windows
注: 证书需要安装到  ** 受信任的根证书目录 ** 下  
参考 [issues#3](https://github.com/CyrilGuoCODE/node-mitmproxy-pro/issues/3)
```
start %HOMEPATH%/node-mitmproxy-pro/node-mitmproxy-pro.ca.crt
```

## 以nodejs模块的方式引用到代码中
```
var mitmproxy = require('node-mitmproxy-pro');

mitmproxy.createProxy({
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (requestId, requestOptions, req, res, proxyReq, ssl, pipe) => {
        console.log(`正在访问：${requestOptions.protocol}//${requestOptions.hostname}:${requestOptions.port}`);
        console.log('cookie:', requestOptions.headers.cookie);
        res.end('Hello node-mitmproxy-pro!');
        pipe();
    },
    responseInterceptor: (requestId, res, proxyRes, ssl, pipe) => {
        pipe();
    }
});
```


## 4、配置详细说明

#### port
启动端口（默认：6789）
```
    port: 6789
```

#### sslConnectInterceptor
判断该connnect请求是否需要代理，传入参数参考[http connnect](https://nodejs.org/api/http.html#http_event_connect) 。

```javascript
(req, cltSocket, head) => {}
```

**参数说明：**
- `req`: 客户端请求对象
- `cltSocket`: 客户端socket连接
- `head`: 客户端请求头

该函数返回一个布尔值，用于判断该connect请求是否需要代理。

---

#### requestInterceptor
请求拦截器，用于拦截和处理HTTP/HTTPS请求。

```javascript
(requestId, requestOptions, req, res, proxyReq, ssl, pipe) => {}
```

**参数说明：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `requestId` | String | 请求唯一标识符，与对应响应的ID保持一致 |
| `requestOptions` | Object | 请求参数对象（可选，参数信息已包含在req.headers中） |
| `req` | Object | 原始请求对象 |
| `res` | Object | 响应对象，可用于提前结束流程并返回自定义响应体，无需经过实际网络请求 |
| `proxyReq` | Object | 代理请求对象，支持修改请求头和请求体 |
| `ssl` | Boolean | 标识是否为HTTPS请求 |
| `pipe` | Function | 管道函数，将请求对象写入代理请求对象。仅在无需修改请求时调用；如需自定义处理，可监听ondata事件自行实现 |

---

#### responseInterceptor
响应拦截器，用于拦截和处理HTTP/HTTPS响应。

```javascript
(requestId, res, proxyRes, ssl, pipe) => {}
```

**参数说明：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `requestId` | String | 请求唯一标识符，与对应请求的ID保持一致 |
| `res` | Object | 响应对象，支持修改响应头和响应体 |
| `proxyRes` | Object | 代理响应对象 |
| `ssl` | Boolean | 标识是否为HTTPS请求 |
| `pipe` | Function | 管道函数，将代理响应对象写入响应对象。仅在无需修改响应时调用；如需自定义处理，可监听ondata事件自行实现 |

---

#### caCertPath
CA根证书路径(ps: 无特殊情况无需配置)
默认：%HOMEPATH%/node-mitmproxy-pro/node-mitmproxy-pro.ca.crt
```
caCertPath: 'xxxx/xxxx.crt'
```

#### caKeyPath
CA根证书密钥路径(ps: 无特殊情况无需配置)
默认：%HOMEPATH%/node-mitmproxy-pro/node-mitmproxy-pro.ca.key.pem
```
caKeyPath: 'xxxx/xxxx.pem'
```

## 5、更多
#### 关于伪造https证书的逻辑图
<img src="doc/img/node-MitmProxy https.png" width=650/>

## 6、API使用示例

```javascript
const mitmproxy = require('node-mitmproxy-pro');

mitmproxy.createProxy({
  sslConnectInterceptor: (req, cltSocket, head) => {
    // 处理SSL连接
    return true;
  },

  requestInterceptor: (requestId, requestOptions, req, res, proxyReq, ssl, pipe) => {
    // 修改请求头
    proxyReq.setHeader('X-Custom-Header', 'CustomValue');

    // 不修改请求时，调用pipe
    pipe();
  },

  responseInterceptor: (requestId, res, proxyRes, ssl, pipe) => {
    // 修改响应头
    res.setHeader('X-Response-Header', 'ResponseValue');

    // 不修改响应时，调用pipe
    pipe();
  }
});
```
