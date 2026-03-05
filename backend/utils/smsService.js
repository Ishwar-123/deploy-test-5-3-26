import dotenv from 'dotenv';
dotenv.config();

/**
 * Send OTP via WhatsApp Template (Type T)
 * @param {string} phone - Recipient phone 91XXXXXXXXXX
 * @param {string} otp   - 6 digit OTP
 */
export const sendWhatsAppOTP = async (phone, otp) => {
    const apiKey = process.env.SMSFORYOU_API_KEY;
    const apiUrl = process.env.SMSFORYOU_API_URL;

    if (!apiKey || !apiUrl) return { success: false, message: 'Missing credentials' };

    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    // Yahan hum Type 'T' (Template) use karenge
    // Jab aap dashboard pe template banayein, toh uska naam yahan likhna hoga
    // Updated to the new Meta-compliant template name
    const templateName = 'admin_password_cyberskill';

    const params = new URLSearchParams({
        apikey: apiKey,
        to: digits,
        type: 'T',              // T for Template
        tname: templateName,    // Aapke naye template ka naam
        values: otp,            // Ye otp {{1}} ki jagah chala jayega
        button_value: otp       // Fix for SF6 error (Required for templates with buttons)
    });

    try {
        console.log(`📱 Sending WhatsApp Template [${templateName}] to ${digits}...`);
        const response = await fetch(`${apiUrl}?${params.toString()}`);
        const data = await response.json();

        console.log(`📱 API Response:`, JSON.stringify(data));

        if (data.status === true) {
            console.log(`✅ WhatsApp OTP sent using template!`);
            return { success: true };
        } else {
            console.warn(`⚠️ Template Error: ${data.message || 'Check if template is approved'}`);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('❌ WhatsApp API Error:', error.message);
        return { success: false, error: error.message };
    }
};

export const sendSMSOTP = sendWhatsAppOTP;
