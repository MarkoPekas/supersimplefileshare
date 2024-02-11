import { NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

export async function POST(request: Request) {
    function generateRandomCode(length: number) {
        var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var code = '';
        for (var i = 0; i < length; i++) {
            var index = Math.floor(Math.random() * characters.length);
            code += characters.charAt(index);
        }
        return code;
    }

    // Immediately capture the file and metadata, then start the upload process
    const formData = await request.formData();
    const blob = formData.get('file') as File;
    const blobName = formData.get('name') as string;
    const folder = generateRandomCode(5); // Create a 5 digit folder name

    // Respond to the client immediately
    (async () => {
        try {
            const buffer = await blob.arrayBuffer();
            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || "");
            const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME || "");

            // upload a small file to test the connection
            const content = "x";
            const blockBlobClientTest = containerClient.getBlockBlobClient(`uploads/${folder}/setfolderprocessing43252362353564325435.txt`);
            await blockBlobClientTest.upload(content, content.length);

            const blockBlobClient = containerClient.getBlockBlobClient(`uploads/${folder}/${blobName}`);
            await blockBlobClient.uploadData(buffer); // Perform the upload in the background
            // Log or handle successful upload
            console.log("Background upload successful:", blobName);
        } catch (error: any) {
            // Log or handle upload error
            console.error("Background upload error:", error.message);
        }
    })();

    // Return response immediately without waiting for the Azure upload to finish
    return NextResponse.json({ message: 'File received, processing started', folder: folder });
}
