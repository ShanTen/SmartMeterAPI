//simulation of the message that is from Twilio number to any other number
//Sending OTP madri 
//No reply is mandated
const twilio = require('twilio');
const config = require('../config');

const account= config.TwilioSID;
const token = config.TwilioToken;
const client = new twilio(account, token);

client.messages.create({
    body: 'Hello from Node',
    to: '+12345678901',
    from: '+12345678901'
}).then((message) => console.log(message.sid));

