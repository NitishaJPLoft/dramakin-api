import mongoose from 'mongoose';
const otpSchema = new mongoose.Schema(
    {
        mobile: {
            type: String,
        },
        email: {
            type: String,
        },

        otp: {
            type: Number,
            required: true,
        },

        sessionID: {
            type: String,
        },
    },
    { timestamps: true }
);

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
