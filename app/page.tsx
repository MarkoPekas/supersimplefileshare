"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { Download, File, FileWarning } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Home() {
  const { toast } = useToast()
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [folderID, setFolderID] = React.useState('');
  const [getFolderID, setGetFolderID] = React.useState('');
  const [listFiles, setListFiles] = React.useState([] as any[]);
  const [uploading, setUploading] = React.useState(false);
  const [exists, setExists] = React.useState<boolean | undefined>(true);
  function handleDownload() {
    axios.get(`/api/download`, {
      params: {
        folderId: getFolderID.toLowerCase()
      }
    }).then((response) => {
      setListFiles(response.data.blobs);
      setExists(response.data.blobs.length>0);
    })
  }

  function hs() {
    setUploading(true);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }
    axios.get(`/api/upload`, {
      params: {
        name: fileRef.current?.files?.[0]?.name
      }
    }).then((response) => {
      console.log(response.data.sasUrl, response.data.folder);
      uploadFile(fileRef.current?.files?.[0] as File, response.data.sasUrl, response.data.folder);
    })
  }

  async function uploadFile(file: File, sasUrl: string, folder: string) {
    axios.put(sasUrl, file, {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      onUploadProgress: function (progressEvent) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        setUploadProgress(percentCompleted); // Update state with progress
      }
    }).then(() => {
      setFolderID(folder);
      setUploading(false);
    }).catch((error) => {
      console.error(error);
      setUploading(false);
    })
  }

  console.log(uploadProgress);
  return (
    <main className="min-h-screen  flex items-center justify-center flex-col text-center xl:text-left">
      <div className="flex items-center justify-center p-4">
        <h1 className="scroll-m-20 xl:pb-10 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Super Simple Large File Share
        </h1>
      </div>
      <div className="flex items-center justify-center p-4 w-full max-w-md">
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="share" className="flex-1">Share</TabsTrigger>
            <TabsTrigger value="recieve" className="flex-1">Recieve</TabsTrigger>
          </TabsList>
          <TabsContent value="share">
            <div className="flex flex-col items-center justify-center">
              <div className="flex w-full items-center gap-1.5">
                {/* <Label htmlFor="picture">Choose a file</Label> */}
                <Input ref={fileRef} id="file" type="file" />
                <Button className="w-min" onClick={hs}
                  disabled={uploading}
                >Upload</Button>
              </div>
              <div className={`
                  w-full mt-4 transition-transform overflow-hidden ${(uploadProgress === 0 || uploadProgress === 100) ? 'h-0' : 'h-4'}
                `}>
                <Progress value={uploadProgress} max={100} />
              </div>
              {folderID ? <p className="leading-7 [&:not(:first-child)]:mt-6">
                Your file share code is: <Button className="ml-2" size={"sm"} variant={"outline"}
                  onClick={() => {
                    navigator.clipboard.writeText(folderID).then(() => {
                      toast({
                        title: 'Copied to clipboard',
                        description: 'You can now share the code with anyone',
                      })
                    })
                  }}
                >{folderID}</Button>
              </p> : null}
            </div>
          </TabsContent>
          <TabsContent value="recieve">
            <div className="flex flex-col gap-4 items-center justify-center">
              <div className="flex w-full items-center gap-1.5">
                {/* <Label htmlFor="picture">Choose a file</Label> */}
                <Input id="code" onChange={(e) => setGetFolderID(e.target.value)} />
                <Button type="submit" className="w-min" onClick={handleDownload}>Download</Button>
              </div>
              {
                listFiles?.map((file, i) => {
                  return (
                    <Alert className="text-left cursor-pointer" key={file.size} onClick={() => {
                      window.open(file.url, '_blank');
                    }}>
                      <File className="h-4 w-4" />
                      <div className="flex items-center justify-between">
                        <div>
                          <AlertTitle>{
                            file.name.split('/').pop()
                          }</AlertTitle>
                          <AlertDescription>
                            {/* filesize */}
                            {humanFileSize(file.size)}
                          </AlertDescription>
                        </div>
                        <Download className="h-6 w-6" />
                      </div>
                    </Alert>
                  )
                })}
              {
                exists === true
                  ? null :
                  <Alert className="text-left cursor-pointer">
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>
                      The code does not exist
                    </AlertTitle>
                    <AlertDescription>
                      Please check the code and try again
                    </AlertDescription>
                  </Alert>
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <p className="leading-7 [&:not(:first-child)]:mt-8 px-2">
        Upload a file, get a link, share it with anyone. No limits, no fees. It{"'"}s that simple.
      </p>
    </main>
  );
}

function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}