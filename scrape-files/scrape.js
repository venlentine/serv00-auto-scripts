
const fs = require('fs');
const https = require('https');

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
        } catch (error) {
            console.error(`Error downloading file ${filename}: ${error}`);
        }
  }
}

// const files = process.env.DOWNLOAD_FILES;
const jsonString = '[{"url":"https://aktv.top/live.txt","filename":"live.txt"},{"url":"https://m3u.ibert.me/txt/j_iptv.txt","filename":"j_iptv.txt"},{"url":"https://m3u.ibert.me/txt/fmml_dv6.txt","filename":"fmml_dv6.txt"},{"url":"https://m3u.ibert.me/txt/o_cn.txt","filename":"o_cn.txt"},{"url":"https://live.fanmingming.cn/tv/m3u/ipv6.m3u","filename":"ipv6.m3u"}]';
// const jsonString = process.env.DOWNLOAD_FILES;

const urlsJson = JSON.parse(jsonString);

const destinationFolder = './data';

downloadFiles(urlsJson, destinationFolder);

