import multer from "multer";
const storage = multer.diskStorage({
  filename: (req, file, callBack) => {
    callBack(null, file.originalname);
  },
});

const upload = multer({ storage }); 

const memStorage = multer.memoryStorage()

export const memUpload = multer({storage : memStorage})

  

export default upload;
