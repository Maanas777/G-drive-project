import fs from 'fs';
import credentials from '../credentials.json' assert { type: 'json' };
import { google } from 'googleapis';

import dotenv from 'dotenv'
dotenv.config()

const client_id=credentials.web?.client_id
const client_seceret=credentials.web?.client_secret
const redirect_uri=credentials.web?.redirect_uris
const auth2Client=new google.auth.OAuth2(client_id,client_seceret,redirect_uri[0])





const targetDirectoryId = process.env.targetDirectoryId
const targetFileName = 'uploaded-video.mp4'; 
const sourceFilePath='../Free_Test_Data_7MB_MP4.mp4'


const download_controller = {
    initiateChunkedUpload: async (auth2Client, sourceFilePath, targetFileName, targetDirectoryId) => {
      try {
        const drive = google.drive({ version: 'v3', auth: auth2Client });
        const videoFileStream = fs.createReadStream(sourceFilePath);
  
        const media = {
          mimeType: 'video/mp4',
          body: videoFileStream,
        };
  
        const response = await drive.files.create({
          media: media,
          resource: {
            name: targetFileName,
            parents: [targetDirectoryId],
          },
        });
  
        console.log('Chunked upload complete. File ID:', response.data.id);
      } catch (error) {
        console.error('Error uploading the video:', error);
        throw error;
      }
    },
  
    fileUpload: (req, res) => {
      if (req.body.token == null) return res.status(400).send('Token not found');
      auth2Client.setCredentials(req.body.token);
      const drive = google.drive({ version: 'v3', auth: auth2Client });
      const fileId = req.params.id;
  
      drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' },
        function (err, response) {
          if (err) {
            console.error('Error', err);
            return res.status(500).send('Error downloading the video');
          }
  
          const videoFileStream = fs.createWriteStream('downloaded-video.mp4');
  
          response.data
            .on('end', () => {
              console.log('Video download complete');
              // Call the initiateChunkedUpload function here
              download_controller.initiateChunkedUpload(auth2Client, sourceFilePath, targetFileName, targetDirectoryId);
            })
            .on('error', (err) => {
              console.error('Error downloading the video', err);
              return res.status(500).send('Error downloading the video');
            });
  
          response.data.pipe(videoFileStream);
        }
      );
    },
  };
  
  export default download_controller;
  