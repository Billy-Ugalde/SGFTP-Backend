export interface IAuthEmailService {
  sendAccountActivationEmail(
    recipientEmail: string, // ← Email real de Person
    recipientName: string,
    temporaryPassword: string,
    userRoles: string[]
    ): Promise<void>

  sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetToken: string
  ): Promise<void>;

  sendEmailVerificationEmail(
    recipientEmail: string,
    recipientName: string,
    verificationToken: string
  ): Promise<void>;
}

export interface IEmailProvider {
  sendEmail(mailOptions: EmailOptions): Promise<void>;
  verify(): Promise<boolean>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}