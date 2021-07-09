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
        type: { type: String, default: 'mobile' },
    },
    { timestamps: true }
);

const Otp = mongoose.model('VerificationOtp', otpSchema);

export default Otp;
