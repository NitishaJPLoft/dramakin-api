import axios from 'axios';

class SMS {
    /**
     * Send OTP
     */
    static sendOtp = async (phoneNo: any, OTP: number) => {
        const uri = `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/${phoneNo}/${OTP}`;
        const response = await axios.get(uri);
        return response;
    };

    /**
     * Verify OTP
     */

    static verifyOTP = async (sessionID: any, OTP: number) => {
        const uri = `https://2factor.in/API/V1/${process.env.SMS_API_KEY}/SMS/VERIFY/${sessionID}/${OTP}`;
        const response = await axios.get(uri);
        return response;
    };
}

export default SMS;
