import Express  from "express";
const router=Express.Router()
import downloadController from '../controllers/videoController.js'


router.post('/download/:id',downloadController.fileUpload)

export default router;