import Express  from "express";
const router=Express.Router()
import DriveController from '../controllers/userAccessController.js'


router.get('/getAuthURL',DriveController.getAuthURL)
router.post('/getToken',DriveController.getToken)
router.post('/getUserInfo',DriveController.getUserInfo)
router.post('/readDrive',DriveController.readDrive)


export default router;