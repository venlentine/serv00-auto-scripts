
const fs = require('fs');
const https = require('https');
const qiniu = require('qiniu');

// const jsonString = '[{"url":"https://img-home.csdnimg.cn/images/20250107060517.png","filename":"1.png"}]';
const jsonString = process.env.DOWNLOAD_FILES;
const urlsJson = JSON.parse(jsonString);
const destinationFolder = './data';
// 七牛云配置
const accessKey = process.env.QINIU_ACCESS_KEY;
const secretKey = process.env.QINIU_SECRET_KEY;
// 七牛云存储空间名
const bucket = 'carewee';
const qiniu_folder = 'github';
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const config = new qiniu.conf.Config();
// 选择对应的存储区域
config.zone = qiniu.zone.Zone_na0;
const formUploader = new qiniu.form_up.FormUploader(config);
// 缓存刷新
const cdnManager = new qiniu.cdn.CdnManager(mac);

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            resolve();
        });
    }).on('error', (error) => {
        fs.unlink(destination, (err) => {
            if (err) throw err;
            // console.log('path/file.txt was deleted');
        });
        reject(error);
    });
  });
}

async function downloadFiles(urls, destinationFolder) {
    // 创建文件夹
    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder, { recursive: true });
        console.log(`Directory ${destinationFolder} created.`);
    }

    // 循环下载文件
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i].url;
        const filename = urls[i].filename;
        const destination = `${destinationFolder}/${filename}`;
        try {
            await downloadFile(url, destination);
            console.log(`File ${filename} downloaded successfully.`);
            await uploadFile(`${destination}`, `${qiniu_folder}/${filename}`);
            console.log(`File ${filename} to qiniu uploaded successfully.`);
        } catch (error) {
            console.error(`Error file ${filename}: ${error}`);
        }
  }
}

// 生成上传 Token
function uploadToken(bucket, key) {
    const putPolicy = new qiniu.rs.PutPolicy({ scope: `${bucket}:${key}` });
    return putPolicy.uploadToken(mac);
}

// 上传单个文件到七牛云
function uploadFile(localFile, key) {
    const modifiedKey = key
    // 上传重命名
    let putExtra = new qiniu.form_up.PutExtra(modifiedKey);
    putExtra.fname = modifiedKey;

    return new Promise((resolve, reject) => {
        const token = uploadToken(bucket, modifiedKey);
        formUploader.putFile(token, modifiedKey, localFile, putExtra, async (err, body, info) => {
            if (err) {
                reject(err);
                return;
            }
            if (info.statusCode === 200) {
                // 上传成功后刷新缓存
                await refreshFileCache([modifiedKey]);
                resolve(body);
            } else {
                reject(new Error(`上传失败: ${info.statusCode}`));
            }
        });
    });
}

// 刷新缓存
function refreshFileCache(urls) {
    return new Promise((resolve, reject) => {
        // 提交刷新任务
        cdnManager.refreshUrls(urls, (err, respBody, respInfo) => {
            if (err) {
                reject(err);
                return;
            }
            if (respInfo.statusCode === 200) {
                resolve(respBody);
            } else {
                reject(new Error(`刷新失败: ${respInfo.statusCode}`));
            }
        });
    });
}

downloadFiles(urlsJson, destinationFolder);

