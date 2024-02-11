import { BlobSASPermissions, BlobServiceClient, ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'file.unknown';

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING||"";
  const containerName = process.env.AZURE_CONTAINER_NAME||"";
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const folder = createRandomString(5);
  const blobName = name
  const startsOn = new Date();
  const expiresOn = new Date(new Date().valueOf() + 3600 * 1000); // 1 hour from now

  // Generate SAS token for the blob
  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName: `uploads/${folder}/${blobName}`,
    permissions: "cwr" as unknown as BlobSASPermissions, // Create, write, and read permissions
    startsOn: startsOn,
    expiresOn: expiresOn,
  }, BlobServiceClient.fromConnectionString(connectionString).credential as any).toString();

  const sasUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/uploads/${folder}/${blobName}?${sasToken}`;

  return new Response(JSON.stringify({ sasUrl, folder }), { status: 200 });
}

function createRandomString(length: number) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}