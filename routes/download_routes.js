import Express  from "express";
const router=Express.Router()
import downloadController from '../controllers/videoController.js'

//download and upload video
router.post('/download/:id',downloadController.fileUploadAndDownload)




export default router;