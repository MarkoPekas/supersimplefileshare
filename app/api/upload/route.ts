// app/api/upload.js
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

  try {
    const formData = await request.formData();
    const blob = formData.get('file') as File;
    const buffer = await blob.arrayBuffer();
    console.log("File uploading: ", formData.get('name') as string);
    // create a 5 digit foleder name
    
    const folder = generateRandomCode(5);
    // Initialize Azure Blob Service Client
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || "");
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME || "");

    console.log("Uploading blob: ", blob);
    const blobName = formData.get('name') as string;
    const blockBlobClient = containerClient.getBlockBlobClient(`uploads/${folder}/${blobName}`);

    // Upload the file to Azure Blob Storage
    const uploadBlobResponse = await blockBlobClient.uploadData(buffer);
    console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);

    return NextResponse.json({ message: 'File uploaded successfully', requestId: uploadBlobResponse.requestId, folder: folder });
  } catch (error: any) {
    console.error("Error uploading blob: ", error.message);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
