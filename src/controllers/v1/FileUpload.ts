import { UserRole } from '@prisma/client'
import { Response, NextFunction, AuthRequest } from 'express'
import Joi from 'joi'

import s3Service from '../../services/AwsS3'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { IError } from '../../utils/IError'

export class FileUpload extends AbstractController {
    public static readonly schemas = {
        request: {
            putFile: JoiCommon.object.request.keys({
                body: Joi.object({
                    files: Joi.array()
                        .items(Joi.object({
                            filename: Joi.string().required(),
                            contentType: Joi.string()
                                .valid('image/png', 'image/jpeg', 'image/jpg', 'image/webp')
                                .required()
                        }))
                        .min(1)
                        .max(20)
                        .required()
                })
            }).required()
        },
        response: {
            putFile: Joi.object({
                files: Joi.array()
                    .items(Joi.object({
                        publicUrl: Joi.string().uri()
                            .required(),
                        uploadUrl: Joi.string().uri()
                            .required(),
                        key: Joi.string().required()
                    }))
                    .required(),
                message: Joi.string().required()
            })

        }
    }

    constructor() {
        super()
    }

    private PutFileReqType: Joi.extractType<typeof FileUpload.schemas.request.putFile>
    private PutFileResType: Joi.extractType<typeof FileUpload.schemas.response.putFile>
    public async putFile(
        req: AuthRequest & typeof this.PutFileReqType,
        res: Response<typeof this.PutFileResType>,
        next: NextFunction
    ) {
        try {
            const { body, user } = req
            const { files } = body

            if (user.role === UserRole.User && files.length > 1) {
                throw new IError(403, req.t('Uploading more then one file is forbidden'))
            }

            const results = await Promise.all(files.map((file) =>
                s3Service.getUploadUrl(
                    file.filename,
                    file.contentType
                )))

            return res.status(200).json({
                files: results,
                message: results.length > 1 ? req.t('Images were uploaded successfully') : req.t('Image was uploaded successfully')
            })
        } catch (err) {
            return next(err)
        }
    }

}