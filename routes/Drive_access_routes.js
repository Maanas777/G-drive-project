import Express  from "express";
const router=Express.Router()
import DriveController from '../controllers/userAccessController.js'

// Get the authorization URL for OAuth2 authentication with Google Drive.
router.get('/getAuthURL',DriveController.getAuthURL)

// Exchange an authorization code for an access token (OAuth2 flow).
router.post('/getToken',DriveController.getToken)

// Fetch user information from Google Drive.
router.post('/getUserInfo',DriveController.getUserInfo)

// Read data or perform operations on Google Drive using the authenticated user's access token.
router.post('/readDrive',DriveController.readDrive)


export default router;