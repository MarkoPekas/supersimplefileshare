// app/api/download.js
import { BlobServiceClient } from "@azure/storage-blob";
import { blob } from "stream/consumers";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || '';
    if (!folderId) {
        return new Response(JSON.stringify({ error: 'No folder ID provided', blobs: [], exists: false }), { status: 400 });
    }
    try {
        // Initialize Azure Blob Service Client
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || "");
        const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME || "");

        const blobsList = [];
        let exists = false;
        for await (const blob of containerClient.listBlobsFlat({ prefix: `uploads/${folderId}` })) {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            // You can also download the blob content here if needed
            // const downloadBlockBlobResponse = await blockBlobClient.download(0);
            // const downloadedContent = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
            // Instead of downloading, we're just listing the blobs here
            if (blob.name.includes("setfolderprocessing43252362353564325435.txt")) {
                exists = true;
                continue;
            }
            blobsList.push({
                name: blob.name,
                url: blockBlobClient.url,
                size: blob?.properties?.contentLength||0,
                // You could also include properties like size or last modified time
                // size: blob.properties.contentLength,
                // lastModified: blob.properties.lastModified
            });
        }
        
        return new Response(JSON.stringify({ message: 'Blobs listed successfully', blobs: blobsList, exists }), { status: 200 });
    } catch (error: any) {
        console.error("Error listing blobs: ", error.message);
        return new Response(JSON.stringify({ error: 'Error listing blobs' }), { status: 500 });
    }
}

// Helper function to read a blob stream into a buffer - uncomment if downloading content
// async function streamToBuffer(readableStream) {
//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     readableStream.on('data', (data) => {
//       chunks.push(data instanceof Buffer ? data : Buffer.from(data));
//     });
//     readableStream.on('end', () => {
//       resolve(Buffer.concat(chunks));
//     });
//     readableStream.on('error', reject);
//   });
// }
