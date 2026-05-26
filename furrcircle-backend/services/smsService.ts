import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Sends a backend-generated SMS OTP.
 * If AWS credentials are missing or the send fails, it falls back to printing the OTP code to console
 * so that developers can still view it in the backend logs without getting blocked.
 */
export const sendSmsOtp = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
  const message = `[FurrCircle] Your verification code is: ${otpCode}. It will expire in 15 minutes.`;
  
  // Dev log for easy debugging
  console.log(`[SMS OTP] Generated OTP ${otpCode} for phone: ${phoneNumber}`);

  const hasAwsCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  if (!hasAwsCreds) {
    console.warn(`[SMS Fallback] AWS credentials are not configured in .env. Falling back to console output.`);
    console.log(`\n==========================================\n[SMS OTP LOG] Phone: ${phoneNumber} | Code: ${otpCode}\n==========================================\n`);
    return true;
  }

  try {
    const response = await snsClient.send(
      new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
      })
    );
    console.log(`[SMS OTP] Sent via AWS SNS successfully, messageId: ${response.MessageId}`);
    return true;
  } catch (error: any) {
    console.error(`[SMS OTP] Failed to send via AWS SNS:`, error.message || error);
    console.log(`\n==========================================\n[SMS OTP FALLBACK LOG] Phone: ${phoneNumber} | Code: ${otpCode}\n==========================================\n`);
    return false;
  }
};
