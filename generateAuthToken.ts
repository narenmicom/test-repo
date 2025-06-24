import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as fs from 'fs/promises'; // Use fs/promises for async file operations

// Initialize Google Cloud Storage client
// This will automatically use credentials from GOOGLE_APPLICATION_CREDENTIALS
// environment variable or from the Google Cloud environment (e.g., Compute Engine)
const storage = new Storage({
    projectId: "ascendant-chain-417206",
    keyFilename: "./ascendant-chain-417206-8ed69bb283f0.json"
});

/**
 * Lists all blobs (files) in a specified bucket that begin with a given prefix.
 * This can be used to list objects within a "folder".
 *
 * @param bucketName The name of your GCS bucket (e.g., "snow-attachments").
 * @param prefix The prefix to filter objects by (e.g., "sc_request/").
 * Include a trailing slash to treat it like a folder.
 * @param delimiter An optional delimiter (e.g., '/') to emulate directory structure.
 * If provided, it will list only immediate "children" and "sub-folders".
 */
async function listBlobsWithPrefix(bucketName: string, prefix: string, delimiter?: string): Promise<void> {
    try {
        const [files] = await storage.bucket(bucketName).getFiles({
            prefix: prefix,
            delimiter: delimiter,
        });

        console.log(`\n--- Listing blobs in gs://${bucketName}/${prefix} ---`);

        if (files.length === 0) {
            console.log('No files found with the given prefix.');
        } else {
            for (const file of files) {
                console.log(file.name);
            }
        }

        // If a delimiter is used, `getFiles` also returns prefixes (sub-folders)
        if (delimiter) {
            const [_, query] = await storage.bucket(bucketName).getFiles({
                prefix: prefix,
                delimiter: delimiter,
            });
            if (query.prefixes && query.prefixes.length > 0) {
                console.log('\nSub-folders (prefixes):');
                query.prefixes.forEach(subPrefix => console.log(subPrefix));
            } else {
                console.log('No sub-folders found.');
            }
        }

    } catch (error: any) {
        console.error(`Error listing blobs: ${error.message}`);
    }
}

/**
 * Downloads a specific blob (file) from a GCS bucket.
 *
 * @param bucketName The name of your GCS bucket.
 * @param gcsFilePath The full path to the object within the bucket (e.g., "sc_request/document.pdf").
 * @param destinationPath The local path where the file will be saved (e.g., "downloads/document.pdf").
 */
async function downloadBlob(bucketName: string, gcsFilePath: string, destinationPath: string): Promise<boolean> {
    try {
        console.log(`\n--- Downloading gs://${bucketName}/${gcsFilePath} to ${destinationPath} ---`);

        // Ensure the destination directory exists
        const destinationDir = path.dirname(destinationPath);
        await fs.mkdir(destinationDir, { recursive: true });

        await storage.bucket(bucketName).file(gcsFilePath).download({
            destination: destinationPath,
        });

        console.log(`Blob ${gcsFilePath} downloaded to ${destinationPath}.`);
        return true;
    } catch (error: any) {
        console.error(`Error downloading blob ${gcsFilePath}: ${error.message}`);
        return false;
    }
}

/**
 * Uploads a file to a GCS bucket. Included for comprehensive testing.
 *
 * @param bucketName The name of your GCS bucket.
 * @param localFilePath The local path to the file you want to upload.
 * @param gcsDestinationPath The desired full path for the file in GCS (e.g., "sc_request/new-upload.txt").
 */
async function uploadBlob(bucketName: string, localFilePath: string, gcsDestinationPath: string): Promise<boolean> {
    try {
        console.log(`\n--- Uploading ${localFilePath} to gs://${bucketName}/${gcsDestinationPath} ---`);

        await storage.bucket(bucketName).upload(localFilePath, {
            destination: gcsDestinationPath,
        });

        console.log(`File ${localFilePath} uploaded to ${gcsDestinationPath} in bucket ${bucketName}.`);
        return true;
    } catch (error: any) {
        console.error(`Error uploading file ${localFilePath}: ${error.message}`);
        return false;
    }
}

// --- Main execution ---
async function main() {
    const bucketName = "snow-attachments"; // Your specified bucket name
    const prefix = "sc_request/"; // Your specified prefix (folder)

    // 1. List files (objects) within the 'sc_request/' prefix
    // console.log("Attempting to list files directly within 'sc_request/' (like a folder view)...");
    // await listBlobsWithPrefix(bucketName, prefix, '/');

    console.log("\nAttempting to list ALL files recursively within 'sc_request/'...");
    await listBlobsWithPrefix(bucketName, prefix); // No delimiter for recursive listing


    // 2. Example: Upload a dummy file for testing download
    // const dummyLocalUploadFile = 'src/test_upload_ts.txt';
    // const gcsUploadPath = `${prefix}my_typescript_test_file.txt`; // Upload inside sc_request/

    // try {
    //     await fs.writeFile(dummyLocalUploadFile, 'This is a test file uploaded via TypeScript.');
    //     console.log(`\nCreated dummy file: ${dummyLocalUploadFile}`);
    // } catch (e: any) {
    //     console.error(`Failed to create dummy file: ${e.message}`);
    //     process.exit(1);
    // }

    // const uploadSuccess = await uploadBlob(bucketName, dummyLocalUploadFile, gcsUploadPath);

    // if (uploadSuccess) {
    //     // 3. Example: Download the uploaded dummy file
    //     const downloadedLocalPath = 'downloads/downloaded_ts_file.txt'; // Local path to save it

    //     const downloadSuccess = await downloadBlob(bucketName, gcsUploadPath, downloadedLocalPath);

    //     if (downloadSuccess) {
    //         console.log(`\nSuccessfully downloaded and saved to: ${downloadedLocalPath}`);
    //         try {
    //             const content = await fs.readFile(downloadedLocalPath, 'utf-8');
    //             // console('Downloaded file content preview (first 200 chars):');
    //             // console(content.substring(0, 200));
    //         } catch (readError: any) {
    //             console.error(`Error reading downloaded file: ${readError.message}`);
    //         }
    //     } else {
    //         console.log('Download operation failed.');
    //     }
    // } else {
    //     console.log('Upload operation failed. Skipping download test.');
    // }

    // // Clean up local dummy file
    // try {
    //     if (await fs.stat(dummyLocalUploadFile)) {
    //         await fs.unlink(dummyLocalUploadFile);
    //         // console(`\nCleaned up local dummy upload file: ${dummyLocalUploadFile}`);
    //     }
    // } catch (e: any) {
    //     // File might not exist if creation failed, or already deleted
    //     if (e.code !== 'ENOENT') {
    //          console.error(`Error cleaning up ${dummyLocalUploadFile}: ${e.message}`);
    //     }
    // }

    // Clean up downloaded file if it exists (optional)
    // try {
    //     const downloadedFileExists = await fs.stat(downloadedLocalPath).catch(() => null);
    //     if (downloadedFileExists) {
    //         await fs.unlink(downloadedLocalPath);
    //         console(`Cleaned up local downloaded file: ${downloadedLocalPath}`);
    //     }
    // } catch (e: any) {
    //     if (e.code !== 'ENOENT') {
    //         console.error(`Error cleaning up ${downloadedLocalPath}: ${e.message}`);
    //     }
    // }
}

// Run the main function
main().catch(console.error);

