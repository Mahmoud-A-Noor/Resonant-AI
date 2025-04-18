import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { getOrCreateChatId, renewChatId } from '@/services/session';

const FileUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    renewChatId();
  }, []);

  const chatId = getOrCreateChatId();

  const ALLOWED_FILE_TYPES = [
    // Documents
    '.pdf', '.txt', '.md', '.doc', '.docx', '.rtf',
    // Code files
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.html', '.css', '.json', '.xml'
  ];

  const isFileAllowed = (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ALLOWED_FILE_TYPES.includes(ext);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const allowedFiles = droppedFiles.filter(file => {
      const allowed = isFileAllowed(file);
      if (!allowed) {
        toast.error(`File type not supported: ${file.name}. Only PDF and text-based files are allowed.`);
      }
      return allowed;
    });

    setFiles([...files, ...allowedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const allowedFiles = selectedFiles.filter(file => {
        const allowed = isFileAllowed(file);
        if (!allowed) {
          toast.error(`File type not supported: ${file.name}. Only PDF and text-based files are allowed.`);
        }
        return allowed;
      });

      setFiles([...files, ...allowedFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);
    
    try {
      await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', chatId);

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload/${chatId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            }
          }
        });
      }));

      toast.success("Files uploaded successfully!");
      navigate('/voice-chat');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Upload Files
          </CardTitle>
          <CardDescription className="text-lg">
            Upload your files to start the voice chat experience
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-gray-200 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Drag and drop your files here</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">or click to browse files</p>
            
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="mt-2" asChild>
                <span>Select Files</span>
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <span className="sr-only">Remove file</span>
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isUploading && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all"
            size="lg"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <div className="flex items-center">
                <span className="mr-2">Uploading</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Upload and Continue
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FileUpload;
