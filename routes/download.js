
// Importing required modules
const fs = require('fs');
const { google } = require('googleapis');
const { Readable } = require('stream');

// Function to download a file from Google Drive
async function downloadFile(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  const dest = fs.createWriteStream('video.mp4');
  return new Promise((resolve, reject) => {
    res.data
      .on('end', () => {
        console.log('Download complete.');
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error during download: ${err.message}`);
        reject(err);
      })
      .pipe(dest);
  });
}

// Function to upload a file to Google Drive
async function uploadFile(auth, filename, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  const fileSize = fs.statSync(filename).size;
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      body: fs.createReadStream(filename),
    },
  }, {
    onUploadProgress: (evt) => {
      const progress = (evt.bytesRead / fileSize) * 100;
      console.log(`Uploading ${filename}: ${Math.round(progress)}% complete.`);
    },
  });
  console.log(`Upload complete. File ID: ${res.data.id}`);
}

// Function to upload a file in chunks to Google Drive
async function uploadFileInChunks(auth, filename, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  const fileSize = fs.statSync(filename).size;
  const chunkSize = 256 * 1024; // 256 KB
  const numChunks = Math.ceil(fileSize / chunkSize);
  let currentChunk = 0;
  let currentByte = 0;
  let retriesLeft = 3;
  let buffer = Buffer.alloc(chunkSize);
  
  // Create a readable stream for the file
  const stream = new Readable({
    read() {
      if (currentByte >= fileSize) {
        this.push(null);
        return;
      }
      
      // Read the next chunk into the buffer
      fs.readSync(fs.openSync(filename, 'r'), buffer, 0, chunkSize, currentByte);
      currentByte += chunkSize;
      
      // Push the chunk onto the stream
      this.push(buffer);
      
      // Clear the buffer for the next chunk
      buffer = Buffer.alloc(chunkSize);
      
      // Increment the current chunk counter
      currentChunk++;
    },
  });
  
  // Create the initial request for resumable upload session
  let resumableSessionUri;
  
  try {
    const res1 = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType: 'video/mp4',
        size: fileSize,
      },
      media: {
        mimeType: 'video/mp4',
        body: stream,
      },
    }, { validateStatus: () => true });
    
    if (res1.status === 200 || res1.status === 201) {
      console.log(`Upload complete. File ID: ${res1.data.id}`);
    } else if (res1.status === 308) {
      resumableSessionUri = res1.headers['location'];
    } else {
      throw new Error(`Unexpected response status code ${res1.status}`);
    }
    
    // Upload each chunk in turn
    while (currentChunk <= numChunks) {
      
      // Calculate the range of bytes for this chunk
      const startByte = (currentChunk - 1) * chunkSize;
      const endByte = Math.min(currentChunk * chunkSize - 1, fileSize - 1);
      
      // Create a buffer for this chunk
      const chunkBuffer = Buffer.alloc(endByte - startByte + 1);
      
      // Read the bytes for this chunk into the buffer
      fs.readSync(fs.openSync(filename, 'r'), chunkBuffer, 0, endByte - startByte + 1, startByte);
      
      // Upload this chunk to Google Drive
      let res2;
      
      try {
        res2 = await drive.files.create({
          requestBody: {},
          media: {
            mimeType: 'video/mp4',
            body: chunkBuffer,
          },
          headers: {
            'Content-Range': `