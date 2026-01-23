import { createRouteHandler } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

import { ourFileRouter } from "./core";

// Create the route handler
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

// Export UTApi for file deletion
export const utapi = new UTApi();
