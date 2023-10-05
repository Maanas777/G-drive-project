import Express  from "express";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import cors from 'cors'
import * as credentials from './credentials.json' assert { type: 'json' };
import fs from 'fs' 
import formidable from "formidable";

import { google } from "googleapis";
import readline from "readline";

import chalk from "chalk";

dotenv.config()

const app=Express()

const PORT=process.env.PORT||4000

app.use(Express.json());

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(routes)


const client_id=credentials.default.web?.client_id
const client_seceret=credentials.default.web?.client_secret
const redirect_uri=credentials.default.web?.redirect_uris
const auth2Client=new google.auth.OAuth2(client_id,client_seceret,redirect_uri[0])

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file']




const targetDirectoryId = '1Aoa7XStHQBYr7AjiREbzkukJPWJ9uyfD'; 
const targetFileName = 'uploaded-video.mp4'; 
const sourceFilePath='../Free_Test_Data_7MB_MP4.mp4'


async function initiateChunkedUpload(auth2Client) {
  try {

    const drive = google.drive({ version: 'v3', auth: auth2Client });

;

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
}

;




app.get('/getAuthURL', (req, res) => {
  const authUrl = auth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPE,
  });
  console.log(authUrl);
  return res.send(authUrl);
});


app.post('/getToken', (req, res) => {

  if (req.body.code == null) return res.status(400).send('Invalid Request');
  auth2Client.getToken(req.body.code, (err, token) => {
      if (err) {
          console.error('Error retrieving access token', err);
          return res.status(400).send(err)
      }
      res.send(token);
  });
});


app.post('/getUserInfo', (req, res) => {
  if (req.body.token == null) return res.status(400).send('Token not found');
  auth2Client.setCredentials(req.body.token);
  const oauth2 = google.oauth2({ version: 'v2', auth: auth2Client });

  oauth2.userinfo.get((err, response) => {
      if (err) res.status(400).send(err);
      console.log(response.data);
      res.send(response.data);
  })
});




app.post('/readDrive', (req, res) => {
  if (req.body.token == null) return res.status(400).send('Token not found');
  auth2Client.setCredentials(req.body.token);
  const drive = google.drive({ version: 'v3', auth: auth2Client });

  const targetFolderName = 'TestDrive';

  drive.files.list({
    q: `name='${targetFolderName}' and mimeType='application/vnd.google-apps.folder'`,
    pageSize: 10,
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return res.status(400).send(err);
    }

    const folders = response.data.files;

    if (folders.length === 0) {
      console.log(`No folder named '${targetFolderName}' found.`);
      return res.status(404).send(`Folder named '${targetFolderName}' not found.`);
    }

    const targetFolderId = folders[0].id;

    drive.files.list({
      q: `'${targetFolderId}' in parents`,
      pageSize: 10,
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return res.status(400).send(err);
      }

      const files = response.data.files;

      if (files.length) {
        console.log('Files:');
        files.map((file) => {
          console.log(`${file.name} (${file.id})`);
        });
      } else {
        console.log(`No files found in folder '${targetFolderName}'.`);
      }

      res.send(files);
    });
  });
});



app.post('/fileUpload', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
      if (err) return res.status(400).send(err);
      const token = JSON.parse(fields.token);
      console.log(token)
      if (token == null) return res.status(400).send('Token not found');
      auth2Client.setCredentials(token);
      console.log(files.file);
      const drive = google.drive({ version: "v3", auth: auth2Client });
      const fileMetadata = {
          name: files.file.name,
      };
      const media = {
          mimeType: files.file.type,
          body: fs.createReadStream(files.file.path),
      };
      drive.files.create(
          {
              resource: fileMetadata,
              media: media,
              fields: "id",
          },
          (err, file) => {
            auth2Client.setCredentials(null);
              if (err) {
                  console.error(err);
                  res.status(400).send(err)
              } else {
                  res.send('Successful')
              }
          }
      );
  });
});



 

  app.post('/download/:id', (req, res) => {
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
        
            initiateChunkedUpload(auth2Client);
          })
          .on('error', (err) => {
            console.error('Error downloading the video', err);
            return res.status(500).send('Error downloading the video');
          });
  
        response.data.pipe(videoFileStream);
      }
    );
  });








app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });