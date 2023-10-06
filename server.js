// Import necessary libraries and modules
import Express from "express";
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import Driveroutes from './routes/Drive_access_routes.js';
import DownloadRoutes from './routes/download_routes.js';
import cors from 'cors';

dotenv.config();

// Create an instance of Express
const app = Express();

// Define the port to listen on
const PORT = process.env.PORT || 4000;

// Set up middleware
app.use(Express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded requests
app.use(bodyParser.json()); // Parse JSON requests

// Use the routes for user authentication, token retrieval, and reading Drive
app.use(Driveroutes);

// Use the routes for downloading and uploading videos
app.use(DownloadRoutes);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
