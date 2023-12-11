import { BaseService, inject } from '@roxavn/core/server';
import { SendEmailService } from '@roxavn/plugin-email-sender/server';
import { CreateOtpApiService } from '@roxavn/plugin-otp/server';
import {
  GetTranslationsbyKeysService,
  TokenService,
} from '@roxavn/module-utils/server';
import { template } from 'lodash-es';

import { constants } from '../base/index.js';

@CreateOtpApiService.useSender(constants.EMAIL_OTP)
export class SendEmailOtpService extends BaseService {
  constructor(
    @inject(TokenService) protected tokenService: TokenService,
    @inject(SendEmailService) protected sendEmailService: SendEmailService,
    @inject(GetTranslationsbyKeysService)
    protected getTranslationsbyKeysService: GetTranslationsbyKeysService
  ) {
    super();
  }

  async handle(request: { lang: string; subject: string }) {
    const otp = await this.tokenService.creator.create({
      alphabetType: 'UPPERCASE_ALPHA_NUM',
      size: 8,
    });
    const translation = await this.getTranslationsbyKeysService.handle({
      keys: [constants.EMAIL_AUTH_SUBJECT, constants.EMAIL_AUTH_CONTENT],
      lang: request.lang,
    });
    const content = template(translation[constants.EMAIL_AUTH_CONTENT])({
      otp,
    });
    await this.sendEmailService.handle({
      to: request.subject,
      subject: translation[constants.EMAIL_AUTH_SUBJECT],
      content: content,
    });

    return {
      otp: otp,
      cooldown: 90 * 1000, // 90 seconds
      duration: 900 * 1000, // 15 minutes
      maxRetryCount: 10,
    };
  }
}
