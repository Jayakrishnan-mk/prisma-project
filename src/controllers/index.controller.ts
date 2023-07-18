import { getSignedDownloadUrls } from '@/middlewares/s3.middleware';
import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };


  public getSignedDownloadUrl = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input_files: string[] = req.body.input_files;

      const file_url_array = await getSignedDownloadUrls(input_files, process.env.PRIVATE_BUCKET_NAME);

      res.send({ file_url_array });

    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  public uploadImages = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      // console.log(req.files[0].originalname)
      const noOfFiles = req.params.noOfFiles;
      let file_url_array: Array<String> = [];
      // if (req.body.projectName) {
      //   for (let element of req.files) {
      //     let filename = element.location.split("/").slice(0, 3).join("/") + "/" + req.body.projectName.split(' ').join('_') + "/" + element.key;
      //     file_url_array.push(filename);
      //   }
      // }
      //else 
      {
        for (let element of req.files) {
          let filename = element.location.split("/").slice(0, 3).join("/") + "/" + element.key;
          file_url_array.push(filename);
        }
      }

      res.send({ url: file_url_array });

    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
