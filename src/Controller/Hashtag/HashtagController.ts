import { Request, Response, NextFunction } from 'express';
import { isEmpty } from 'lodash';
import Videomodel from '../../Models/Video';
/**
 * Crown Controller Class
 *  @author Jai Sharma <jaiprakash.sharma44@gmail.com>
 */
class HashtagController {
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

    getTrendingVideos = async () => {
        const hashtags: any = await this.gethashtags();
        let result: any = [];
        let count = 0;
        let tags = [];
        for (const tag of hashtags) {
            const videos = await Videomodel.find({
                description: { $regex: tag },
            });
            videos.forEach(video => {
                count += video.userViewed.length;
            });

            result.push({
                hashtag: tag,
                viewCount: count,
                videos,
            });

            // unset count
            count = 0;
        }

        const result1 = result.sort((a, b) => b.viewCount - a.viewCount);

        const spliced = result1.splice(0, 20);
        console.log('spliced', spliced);
        spliced.forEach(element => {
            tags.push(`#${element.hashtag}`);
        });
        return tags;
    };

    gethashtags = async () => {
        const videos = await Videomodel.find({});
        let hashTags: any = [];
        let tempArray = [];

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

            // array.forEach(tag => {
            //     if (!isEmpty(tag) && tag !== '' && tag !== ' ') {
            //         tempArray.push(tag.replace(/\s+$/, ''));
            //     }
            // });
            hashTags.push(...trimmedArray);
        }

        console.log('hashtags', hashTags);
        const uniqueHashTags = [...new Set(hashTags)];
        console.log(uniqueHashTags);

        return uniqueHashTags;
    };

    trending = async () => {
        try {
            let hashTags = [
                '#dramaking',
                '#comedy',
                '#dance',
                '#singing',
                '#entertainment',
                '#wedding',
                '#education',
                '#fun',
                '#famouscollab',
                '#famous',
                '#india',
                '#bigboss',
                '#trending',
                '#travel',
                '#nature',
                '#newsong',
                '#viral',
                '#temporarypyar',
                '#galatfehmi',
            ];

            // let hashTags = await this.getTrendingVideos();
            // // send default if nothing there

            // if (hashTags.length === 0) {
            //     hashTags = [
            //         '#dramaking',
            //         '#comedy',
            //         '#dance',
            //         '#singing',
            //         '#entertainment',
            //         '#wedding',
            //         '#education',
            //         '#fun',
            //         '#famouscollab',
            //         '#famous',
            //         '#india',
            //         '#bigboss',
            //         '#trending',
            //         '#travel',
            //         '#nature',
            //         '#newsong',
            //         '#viral',
            //         '#temporarypyar',
            //         '#galatfehmi]',
            //     ];
            // }
            this.res.status(200).json({
                status: 200,
                message: 'success',
                data: {
                    message: 'list',
                    hashTags,
                },
            });
        } catch (error) {
            console.log(error);
            this.res.status(400).json({
                status: 400,
                message: 'error',
                data: {
                    message: error.message,
                    lists: [],
                },
            });
        }
    };
}

export default HashtagController;
