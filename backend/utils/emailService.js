import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send OTP via Email using Nodemailer (SMTP)
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - OTP code
 */
export const sendEmailOTP = async (email, name, otp) => {
    console.log(`Attempting to send OTP email to: ${email} via Nodemailer`);

    // Check for SMTP Credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ SMTP Credentials (EMAIL_USER/EMAIL_PASSWORD) are missing. Skipping email send.');
        return { success: false, message: 'Nodemailer not configured' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Use custom sender name or fallback
        const senderName = (process.env.EMAIL_FROM_NAME || "eBook Platform").replace(/^["']|["']$/g, '');
        const senderEmail = process.env.EMAIL_USER;

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: email,
            subject: `${otp} is your eBook verification code`,
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2">
                    <div style="margin: 50px auto; width: 70%; padding: 20px 0">
                        <div style="border-bottom: 1px solid #eee">
                            <a href="" style="font-size: 1.4em; color: #4f46e5; text-decoration: none; font-weight: 600">eBook Platform</a>
                        </div>
                        <p style="font-size: 1.1em">Hi,</p>
                        <p>Thank you for choosing eBook Platform. Use the following OTP to complete your Log In procedures. OTP is valid for 5 minutes.</p>
                        <h2 style="background: #4f46e5; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otp}</h2>
                        <p style="font-size: 0.9em;">Regards,<br />eBook Team</p>
                        <hr style="border: none; border-top: 1px solid #eee" />
                        <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300">
                            <p>eBook Platform Inc</p>
                            <p>India</p>
                        </div>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Nodemailer Email sent successfully:', info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('Error sending email via Nodemailer:', error);
        return { success: false, error };
    }
};

/**
 * Send Order Confirmation Email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} order - Order details object
 */
export const sendOrderConfirmationEmail = async (email, name, order) => {
    console.log(`Sending order confirmation email to: ${email}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ SMTP Credentials missing. Skipping email.');
        return { success: false };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const receiptLink = `${frontendUrl}/reader/orders?orderNumber=${order.orderNumber}&autodownload=true`;

        const senderName = (process.env.EMAIL_FROM_NAME || "BookVerse").replace(/^["']|["']$/g, '');
        const senderEmail = process.env.EMAIL_USER;

        // Ensure order.items is an array (sometimes it comes as a string from DB)
        let items = [];
        if (order.items) {
            if (Array.isArray(order.items)) {
                items = order.items;
            } else if (typeof order.items === 'string') {
                try {
                    const parsed = JSON.parse(order.items);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    console.error('Failed to parse order.items string:', e);
                }
            } else {
                items = [order.items];
            }
        }

        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">${item.title || item.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹${parseFloat(item.price || item.total || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: email,
            subject: `Thank you for your purchase! - Order #${order.orderNumber}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #ff4d30; margin: 0; font-size: 28px; letter-spacing: -1px;">BOOKVERSE</h1>
                        <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 3px; color: #999; margin-top: 5px;">Your Digital Library</p>
                    </div>

                    <div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; padding: 30px; border-radius: 8px;">
                        <h2 style="margin-top: 0; color: #111;">Order Confirmed!</h2>
                        <p>Hi ${name},</p>
                        <p>Success! Your order has been processed. You can now access your digital content in your library.</p>
                        
                        <div style="margin: 25px 0; border-top: 2px solid #ff4d30; padding-top: 20px;">
                            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase;">Order Details:</p>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${itemsHtml}
                                <tr>
                                    <td style="padding: 12px; font-weight: bold;">Grand Total (Inc. Tax)</td>
                                    <td style="padding: 12px; font-weight: bold; text-align: right;">₹${parseFloat(order.total).toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center; margin-top: 40px;">
                            <a href="${receiptLink}" style="background-color: #ff4d30; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Download Official Receipt</a>
                        </div>
                        
                        <p style="font-size: 11px; color: #666; text-align: center; margin-top: 25px;">
                            Need help? Contact our support at ${process.env.EMAIL_USER}
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, data: info };
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        return { success: false, error };
    }
};

/**
 * Send Admin Notification Email (New Order Alert)
 * @param {object} order - Order details
 * @param {string} buyerName - Buyer's name
 * @param {string} buyerEmail - Buyer's email
 */
export const sendAdminNotificationEmail = async (order, buyerName, buyerEmail) => {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.warn('⚠️ ADMIN_EMAIL not set in .env. Skipping admin notification.');
        return { success: false, message: 'ADMIN_EMAIL not configured' };
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ SMTP Credentials missing. Skipping admin notification.');
        return { success: false };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const senderName = (process.env.EMAIL_FROM_NAME || 'eBook Platform').replace(/^[\"']|[\"']$/g, '');
        const senderEmail = process.env.EMAIL_USER;

        // Parse items safely
        let items = [];
        if (order.items) {
            if (Array.isArray(order.items)) {
                items = order.items;
            } else if (typeof order.items === 'string') {
                try {
                    const parsed = JSON.parse(order.items);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    items = [];
                }
            } else {
                items = [order.items];
            }
        }

        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #333;">${item.title || item.name || 'N/A'}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333;">₹${parseFloat(item.price || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        const orderNumber = order.orderNumber || `#${order.id}`;
        const orderType = order.orderType === 'subscription' ? '📦 Subscription' : '📚 Book Purchase';
        const total = parseFloat(order.total || 0).toFixed(2);
        const tax = parseFloat(order.tax || 0).toFixed(2);
        const subtotal = parseFloat(order.subtotal || 0).toFixed(2);
        const paidAt = order.paidAt ? new Date(order.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: adminEmail,
            subject: `🛒 New Order Received - ${orderNumber} | ₹${total}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #f9f9f9;">
                    
                    <!-- Header -->
                    <div style="background: #111; padding: 24px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #ff4d30; margin: 0; font-size: 24px; letter-spacing: -1px;">BOOKVERSE</h1>
                        <p style="color: #aaa; font-size: 11px; letter-spacing: 3px; margin: 4px 0 0; text-transform: uppercase;">Admin Notification</p>
                    </div>

                    <!-- Body -->
                    <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                        
                        <div style="background: #fff8f5; border-left: 4px solid #ff4d30; padding: 14px 18px; border-radius: 4px; margin-bottom: 24px;">
                            <h2 style="margin: 0 0 4px; font-size: 18px; color: #111;">New Order Received!</h2>
                            <p style="margin: 0; color: #666; font-size: 13px;">${orderType} &nbsp;|&nbsp; Order ${orderNumber} &nbsp;|&nbsp; ${paidAt}</p>
                        </div>

                        <!-- Buyer Info -->
                        <table style="width: 100%; margin-bottom: 20px; font-size: 13px;">
                            <tr>
                                <td style="padding: 6px 0; color: #888; width: 120px;">Buyer Name</td>
                                <td style="padding: 6px 0; font-weight: 600; color: #111;">${buyerName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #888;">Buyer Email</td>
                                <td style="padding: 6px 0; font-weight: 600; color: #111;">${buyerEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #888;">Payment</td>
                                <td style="padding: 6px 0; font-weight: 600; color: #27ae60;">✅ Completed (Razorpay)</td>
                            </tr>
                        </table>

                        <!-- Items Table -->
                        <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 8px; border-top: 1px solid #eee; padding-top: 16px;">Order Items</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888;">Item</th>
                                    <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td style="padding: 8px 12px; color: #888; font-size: 12px;">Subtotal</td>
                                    <td style="padding: 8px 12px; text-align: right; color: #888; font-size: 12px;">₹${subtotal}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 12px; color: #888; font-size: 12px;">GST</td>
                                    <td style="padding: 8px 12px; text-align: right; color: #888; font-size: 12px;">₹${tax}</td>
                                </tr>
                                <tr style="background: #fff8f5;">
                                    <td style="padding: 12px; font-weight: bold; font-size: 15px; color: #111;">Grand Total</td>
                                    <td style="padding: 12px; font-weight: bold; font-size: 15px; text-align: right; color: #ff4d30;">₹${total}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <!-- CTA -->
                        <div style="text-align: center; margin-top: 28px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders" 
                               style="background: #ff4d30; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">
                                View Order in Dashboard
                            </a>
                        </div>

                        <p style="font-size: 11px; color: #bbb; text-align: center; margin-top: 24px;">
                            This is an automated notification from BookVerse Admin System.
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent to ${adminEmail}:`, info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('❌ Error sending admin notification email:', error);
        return { success: false, error };
    }
};
