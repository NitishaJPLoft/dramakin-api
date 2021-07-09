const ObjectId = (
    m = Math,
    d = Date,
    h = 16,
    s = s => m.floor(s).toString(h)
) => s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));
export const getSongIDAndType = (songID: string) => {
    let type = null;
    let id = null;

    if (!songID) {
        return {
            songID,
            type,
            id,
        };
    }
    if (songID.startsWith('local')) {
        type = 'local';
        const idArray = songID.split('-');
        const availableID = idArray[1] ? idArray[1] : null;
        if (availableID) {
            id = songID;
        } else {
            id = 'local-' + ObjectId();
        }
    } else if (songID.startsWith('camera')) {
        type = 'camera';
        const idArray = songID.split('-');
        const availableID = idArray[1] ? idArray[1] : null;
        if (availableID) {
            id = songID;
        } else {
            id = 'camera-' + ObjectId();
        }
    } else if (songID.startsWith('db')) {
        type = 'db';
        id = songID.split('-').pop();
    } else if (songID.startsWith('spotify')) {
        type = 'spotify';
        id = songID.split('-').pop();
    } else {
        type = 'unknown';
        id = songID;
    }
    return {
        songID,
        type,
        id,
    };
};
export const formatSong = (
    id: string,
    name: string,
    thumbnail: string,
    preview_url: string,
    singer: string
) => {
    const music = {
        id,
        name,
        thumbnail: {
            height: 640,
            url: thumbnail,
            width: 640,
        },
        preview_url,
        uri: '',
        artists: [
            {
                external_urls: {
                    spotify: '',
                },
                href: '',
                id: '',
                name: singer,
                type: 'artist',
                uri: '',
            },
        ],
    };

    return music;
};

export const getName = user => {
    const fName = user.firstName;
    const mName = user.middleName;
    const lName = user.lastName;
    if (!fName && !mName && !lName) {
        return user.username;
    } else {
        const firstName = user.firstName ? user.firstName : ' ';
        const middleName = user.middleName ? user.middleName : ' ';
        const lastName = user.lastName ? user.lastName : ' ';
        const name = firstName + ' ' + middleName + ' ' + lastName;
        return name.trim();
    }
};
