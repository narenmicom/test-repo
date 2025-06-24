import { ApiError, Storage } from "@google-cloud/storage";
import { google } from "googleapis";

import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import mime from 'mime-types'; // Optional helper package

// console.log()
// checkConnection();
// downloadAttachment().then((filePath) => {
//     console.log(filePath)
// })

async function checkConnection() {

    // const token = await getToken();

    const storage = new Storage({
        projectId: "ascendant-chain-417206",
        keyFilename: "./ascendant-chain-417206-d1503a82d1d7.json"
    });

    const res = await storage.authClient.getAccessToken()
    console.log(res);

    try {
        const [rootBuckets] = await storage.bucket("snow-attachments").getFiles({
            prefix: "sc_request/",
            delimiter: "/"
        });

        rootBuckets.forEach(file => {
            console.log(file.name);
        })
    } catch (e) {
        console.log(e);
    }

    // console.log(rootBuckets.length);


    // console.log('Buckets:');
    // buckets.forEach(bucket => {
    //     console.log(bucket.id);
    //     if (bucket.id != null) {
    //         const [folder] = await storage.bucket(bucket.id);
    //         console.log(folder);
    //     } 
    // });
    //   checkConnection().catch(console.error);

}



async function getToken() {
    const auth = new google.auth.GoogleAuth({
        keyFile: "./ascendant-chain-417206-8ed69bb283f0.json",
        scopes: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
    });

    return await auth.getAccessToken().then(
        (token) => {
            return token;
        }
    ).catch((err) => console.log("err...", err));
}

async function downloadAttachment(): Promise<string> {

    const INSTANCE = 'dev277283.service-now.com';
    const ATTACHMENT_SYS_ID = 'a5957ce1839622103267f896feaad3da';
    const USERNAME = 'admin';
    const PASSWORD = 'wY7^u3nt$QMU'; // Or use OAuth token
    const __dirname = path.resolve();
    const url = `https://${INSTANCE}/api/now/attachment/${ATTACHMENT_SYS_ID}/file`;

    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            auth: {
                username: USERNAME,
                password: PASSWORD
            }
        });

        const contentType = response.headers['content-type'];
        const fileName = response.headers["file_name"];
        const extension = mime.extension(contentType) || 'bin';
        const fullFileName = `${fileName}.${extension}`;
        const filePath = path.resolve(__dirname, fullFileName); // Absolute path

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });

    } catch (error) {
        throw new Error('Download failed: ' + (error as Error).message);
    }
}