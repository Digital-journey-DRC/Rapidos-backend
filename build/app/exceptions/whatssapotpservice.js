import axios from 'axios';
import env from '#start/env';
export const WhatsappService = {
    async sendOtp(to, otp) {
        const payload = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: 'otp_3',
                language: { code: 'fr' },
                components: [
                    {
                        type: 'body',
                        parameters: [{ type: 'text', text: otp.toString() }],
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: '0',
                        parameters: [{ type: 'text', text: otp.toString() }],
                    },
                ],
            },
        };
        const config = {
            method: 'post',
            url: 'https://graph.facebook.com/v16.0/230630080143527/messages',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.get('WHATSAPP_TOKEN')}`,
            },
            data: payload,
        };
        return axios.request(config);
    },
};
//# sourceMappingURL=whatssapotpservice.js.map