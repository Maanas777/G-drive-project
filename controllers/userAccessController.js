// Import necessary libraries and credentials
import { google } from "googleapis";
import credentials from '../credentials.json' assert { type: 'json' };
import dotenv from 'dotenv';
dotenv.config();

// Initialize OAuth2 client with credentials
const client_id = credentials.web?.client_id;
const client_secret = credentials.web?.client_secret;
const redirect_uri = credentials.web?.redirect_uris;
const auth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri[0]);

//  OAuth2 scopes
const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file'];

const G_drive_controller = {
  // Generate and send the authentication URL
  getAuthURL: (req, res) => {
    const authUrl = auth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPE,
    });
    return res.send(authUrl);
  },

  // Exchange the authorization code for an access token
  getToken: (req, res) => {
    if (req.body.code == null) return res.status(400).send('Invalid Request');
    auth2Client.getToken(req.body.code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return res.status(400).send(err);
      }
      res.send(token);
    });
  },


  // Get user information using the access token
  getUserInfo: (req, res) => {
    if (req.body.token == null) return res.status(400).send('Token not found');
    auth2Client.setCredentials(req.body.token);
    const oauth2 = google.oauth2({ version: 'v2', auth: auth2Client });
    oauth2.userinfo.get((err, response) => {
      if (err) res.status(400).send(err);
      console.log(response.data);
      res.send(response.data);
    });
  },



  // List files in a specific Google Drive folder
  readDrive: (req, res) => {
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
  }
}

export default G_drive_controller;
