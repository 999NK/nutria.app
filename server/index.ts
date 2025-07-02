import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CORS configuration for Replit domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://ef025225-635e-46e7-b4d3-a0202f3fe698-00-svbria500cbm.janeway.replit.dev',
    /https:\/\/.*\.replit\.dev$/,
    /https:\/\/.*\.replit\.app$/,
    'http://localhost:5000',
    'https://localhost:5000'
  ];
  
  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    return origin && allowed.test(origin);
  });
  
  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Force cache busting headers for all responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'ETag': `"${Date.now()}"`,
    'Last-Modified': new Date().toUTCString(),
    'Vary': 'Accept-Encoding, User-Agent'
  });

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication and routes first
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite/static serving AFTER all API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  const host = process.env.REPL_OWNER ? "0.0.0.0" : "localhost";
  
  console.log(`Environment: ${app.get("env")}`);
  console.log(`Domain: ${process.env.REPLIT_DEV_DOMAIN || 'localhost'}`);
  console.log(`Starting server on ${host}:${port}`);
  
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
    if (process.env.REPLIT_DEV_DOMAIN) {
      log(`Replit URL: https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
  });
})();
