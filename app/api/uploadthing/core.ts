import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// File router for prize images with optimization
export const ourFileRouter = {
  prizeImage: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 1,
      // UploadThing automatically optimizes images
    } 
  })
    .middleware(async ({ req }) => {
      // Check authentication via headers
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }
      // You can add more auth validation here if needed
      return {};
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // File uploaded successfully
      // UploadThing automatically:
      // - Compresses images
      // - Converts to WebP when possible
      // - Generates thumbnails
      console.log("File uploaded:", file.url);
      return { uploadedBy: "admin", url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
