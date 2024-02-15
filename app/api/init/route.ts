import { BlobServiceClient } from "@azure/storage-blob";

export async function GET(request: Request) {
    let deletedFiles = [];
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
        const containerName = process.env.AZURE_CONTAINER_NAME || "";
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        let iter = containerClient.listBlobsFlat();
        let blobItem: any;
        console.log(iter);

        while (blobItem = (await iter.next()).value) {

            const blobClient = containerClient.getBlobClient(blobItem.name);
            const properties = await blobClient.getProperties();
            const lastModified = properties.lastModified as Date;
            const diff = (new Date() as any - (new Date(lastModified) as any)) / 1000 / 60 / 60; // Difference in hours

            if (diff > 24) {
                await blobClient.delete();
                deletedFiles.push(blobItem.name);
            }
        }
    } catch (error) {
        console.error("errors");
    }
    return new Response(JSON.stringify({ status: "ready" }), { status: 200 });
}
