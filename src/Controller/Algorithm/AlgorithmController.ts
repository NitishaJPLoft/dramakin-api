import { Request, Response, NextFunction } from 'express';
import Videomodel from '../../Models/Video';
import HashtagVideoViewsModel from '../../Models/HashtagVideoViews';

import { isEmpty } from 'lodash';
/**
 *  Auth Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class AlgorithmController {
    req: any;
    res: Response;
    next: NextFunction;

    /**
     * Constructor
     * @param req express.Request
     * @param res  express.Response
     * @param next   express.NextFunction
     */

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
    }

    gethashtags = async () => {
        const videos = await Videomodel.find({});
        let hashTags: any = [];
        for (const video of videos) {
            const description = video.description;
            const array = description.split('#');
            let trimmedArray = [];
            array.forEach(text => {
                if (!isEmpty(text)) {
                    const text1 = text
                        .replace(
                            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                            ''
                        )
                        .trim();
                    const text2 = text1.replace(/[^\w\s]/gi, '').trim();

                    const text3 = text2.replace(/(\r\n|\n|\r)/gm, '');

                    if (!isEmpty(text3)) {
                        trimmedArray.push(text3);
                    }
                }
            });

            hashTags.push(...trimmedArray);
        }
        const uniqueHashTags = Array.from(new Set(hashTags));
        return uniqueHashTags;
    };

    getTrendingVideos = async () => {
        //const hashtags: any = await this.gethashtags();
        let hashtags = [
            'dramaking',
            'comedy',
            'dance',
            'singing',
            'entertainment',
            'wedding',
            'education',
            'fun',
            'famouscollab',
            'famous',
            'india',
            'bigboss',
            'trending',
            'travel',
            'nature',
            'newsong',
            'viral',
            'temporarypyar',
            'galatfehmi',
        ];
        console.log('hashtags', hashtags);
        let result: any = [];
        let count = 0;

        let viewCount = 0;
        for (const tag of hashtags) {
            const query = {
                description: { $regex: tag },
            };
            const videos = await Videomodel.find(query).sort([
                ['userViewed', -1],
            ]);
            const videoCount = await Videomodel.countDocuments(query);

            console.log('videoCount', videoCount, 'array count', videos.length);
            for (const video of videos) {
                viewCount += video.userViewed.length * 10;
            }

            //  find or update
            await HashtagVideoViewsModel.findOneAndUpdate(
                { hashtag: tag },
                {
                    hashtag: tag,
                    viewCount,
                    videoCount,
                },
                { upsert: true }
            );
            result.push({
                hashtag: tag,
                viewCount,
                videoCount,
            });

            // unset count
            count = 0;
        }

        const result1 = result.sort((a, b) => b.viewCount - a.viewCount);
        const spliced = result1.splice(0, 20);
        return spliced;
    };

    trending = async () => {
        try {
            const trending = await this.getTrendingVideos();
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'search result',
                    trending,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    result: [],
                },
            });
        }
    };
}

export default AlgorithmController;
