import ffmpeg from 'fluent-ffmpeg';
//import fs from 'fs';

const transcode = ffmpeg()
    .input('https://dramaking.sgp1.digitaloceanspaces.com/180_480.mp4')
    .on('end', function () {
        console.log('file has been converted succesfully');
    })
    .on('error', function (err) {
        console.log('an error happened: ' + err.message);
    })

    .save('videos/your_target.m3u8');
export default transcode;
