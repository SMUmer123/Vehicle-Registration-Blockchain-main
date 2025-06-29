import emailjs from '@emailjs/browser';

// Initialize EmailJS (add this in your component or a separate config file)
emailjs.init("YOUR_PUBLIC_KEY"); // Get this from EmailJS dashboard

// Email service configuration
const EMAIL_CONFIG = {
  serviceId: 'service_dujo11w',
  templateId: 'template_dln18i6', // Single template for all notifications
  publicKey: 'DMSVbGKB7PjgmE1bJ'
};

// Single email template function
const sendNotificationEmail = async (emailData) => {
  try {
    const templateParams = {
      to_email: emailData.recipientEmail,
      subject: emailData.subject,
      message_type: emailData.type, // 'approval', 'decline', 'transfer', etc.
      user_name: emailData.userName,
      action_type: emailData.actionType, // 'User Registration', 'Vehicle Registration', etc.
      status: emailData.status, // 'Approved', 'Declined', 'Pending'
      details: emailData.details, // Additional details
      reason: emailData.reason || '', // For decline reasons
      admin_name: 'Government Authority',
      contact_email: 'support@yourgovt.com'
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams,
      EMAIL_CONFIG.publicKey
    );

    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};
export default sendNotificationEmail