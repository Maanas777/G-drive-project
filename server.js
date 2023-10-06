import Express  from "express";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import Driveroutes from './routes/Drive_access_routes.js'
import DownloadRoutes from './routes/download_routes.js'
import cors from 'cors'

dotenv.config()
const app=Express()
const PORT=process.env.PORT||4000
app.use(Express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



//Routes to create userAuth, gettingToken, readingDrive
app.use(Driveroutes)

//Routes for downloading and uploading videos
app.use(DownloadRoutes)




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });