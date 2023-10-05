# Google Drive Upload and Download

A Node.js application for efficiently downloading large video files from one Google Drive directory and initiating a chunked upload process to another directory, all while monitoring the status of both operations. This provides real-time visibility into the progress of each chunk of the transfer.

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js and npm installed on your machine.
- Google API credentials JSON file (`credentials.json`) obtained from the Google Developer Console.

### Installation

1. Clone this repository:

   ```shell
   git clone https://github.com/Maanas777/G-drive-upload-download.git

   Install the project dependencies:
   cd G-drive-upload-download
    npm install
### Usage
Create a Google API project and obtain your credentials.json file.
Configure your credentials.json file in the project directory.

Start the server:


npm start

###  Testing the API with Postman
To test the API endpoints and interact with the functions, you can use [Postman](https://www.postman.com/) or any API testing tool of your choice. Follow these steps:
1. Open Postman.
2. Import the provided [Postman collection](https://www.postman.com/aviation-astronaut-94322547/workspace/blog/folder/28648787-2b5db712-a7bf-4f60-a13f-874b96b260b2?action=share&creator=28648787&ctx=documentation) to quickly set up requests for testing.
3.  Configure the environment variables or request parameters as needed for your use case.
4.  Start testing the following endpoints:

	 ### Downloading a Video
 Endpoint: `/api/download/:id
  - Method: `POST`
  - - Description: Download a large video file from a specific Google Drive directory and Initiate the process to upload a downloaded video to another Google Drive directory using chunked uploading.
    - Request Parameters:
    - `id` (string): The unique identifier of the video to download.
  - Example Request:
    ```http
    POST /api/download/your-video-id
    {
      "token": "your-auth-token"
    }
