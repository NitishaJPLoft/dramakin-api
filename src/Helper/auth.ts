export const constructName = (userName: string) => {
    const nameArray = userName.split(' ');
    const filteredArray = nameArray.filter(e => {
        if (e && e !== '') {
            return e.trim();
        }
    });
    const firstName = filteredArray[0] ? filteredArray[0] : '';
    const middleName = filteredArray[1] ? filteredArray[1] : '';
    const lastName = filteredArray[2] ? filteredArray[2] : '';
    return {
        firstName,
        middleName,
        lastName,
    };
};

export const generateUserName = (username = null) => {
    const unique = Math.floor(100000 + Math.random() * 900000);
    const isStartWith = username && username.startsWith('@') ? true : false;
    if (username && isStartWith) {
        return username;
    }
    if (username && !isStartWith) {
        return '@' + username;
    }

    return '@dk' + Math.floor(Math.random() * 100 + 1) + unique;
};

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
