
// Import necessary libraries and credentials
import fs from 'fs';
import credentials from '../credentials.json' assert { type: 'json' };
import { google } from 'googleapis';

import dotenv from 'dotenv'
dotenv.config()


// Initialize OAuth2 client with credentials
const client_id=credentials.web?.client_id
const client_seceret=credentials.web?.client_secret
const redirect_uri=credentials.web?.redirect_uris
const auth2Client=new google.auth.OAuth2(client_id,client_seceret,redirect_uri[0])




//target directory where the  video should upload
const targetDirectoryId = process.env.targetDirectoryId

//name of the video that uploaded
const targetFileName = 'uploaded-video.mp4';

//path of the video that should uploaded.
const sourceFilePath='../Free_Test_Data_7MB_MP4.mp4'



const download_controller = {

///function to upload videos in chunnks
    initiateChunkedUpload: async (auth2Client, sourceFilePath, targetFileName, targetDirectoryId) => {
      try {
        // Create a Google Drive client
        const drive = google.drive({ version: 'v3', auth: auth2Client });

           // Read the video file as a stream
        const videoFileStream = fs.createReadStream(sourceFilePath);
  

           // Define the media properties, specifying the MIME type and the file stream
        const media = {
          mimeType: 'video/mp4',
          body: videoFileStream,
        };

         // Create the file in Google Drive with the specified name and parent directory
        const response = await drive.files.create({
          media: media,
          resource: {
            name: targetFileName,
            parents: [targetDirectoryId],
          },
        });
  // Log the completion of the chunked upload and the File ID of the uploaded file
        console.log('Chunked upload complete. File ID:', response.data.id);
      } catch (error) {
              // Handle errors if any occur during the upload process
        console.error('Error uploading the video:', error);
        throw error;
      }
    },
  

    /// function to download and upload videos. 
    fileUploadAndDownload: (req, res) => {
          // Check if the access token is provided
      if (req.body.token == null) return res.status(400).send('Token not found');

       // Set the provided token as client credentials
      auth2Client.setCredentials(req.body.token);

      // Create a Google Drive client
      const drive = google.drive({ version: 'v3', auth: auth2Client });

      // Get the file ID from the request parameters
      const fileId = req.params.id;
  
        // Download the file from Google Drive
      drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' },
        function (err, response) {
          if (err) {

               // Handle errors if any occur during the download
            console.error('Error', err);
            return res.status(500).send('Error downloading the video');
          }
  
           // Create a write stream to save the downloaded video
          const videoFileStream = fs.createWriteStream('downloaded-video.mp4');
  
           // Listen for the 'end' event to indicate the download completion
          response.data
            .on('end', () => {
              console.log('Video download complete');
          
              // Initiate the chunked upload after the download is complete
              download_controller.initiateChunkedUpload(auth2Client, sourceFilePath, targetFileName, targetDirectoryId);
            })
            .on('error', (err) => {
                 // Handle errors if any occur during the download process
              console.error('Error downloading the video', err);
              return res.status(500).send('Error downloading the video');
            });
  
               // Pipe the download stream to the video file stream
          response.data.pipe(videoFileStream);
        }
      );
    },
  };
  
  export default download_controller;
  