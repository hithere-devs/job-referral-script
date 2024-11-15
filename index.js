require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

// https://developers.google.com/oauthplayground use to generate refresh token and access token
const refreshToken = process.env.REFRESH_TOKEN;
const accessToken = process.env.ACCESS_TOKEN;
const user = process.env.USER;
const role = process.env.ROLE;
const company = process.env.COMPANY;

if (
	!clientId ||
	!clientSecret ||
	!refreshToken ||
	!accessToken ||
	!user ||
	!role ||
	!company
) {
	console.error('Error: Missing required environment variables.');
	process.exit(1);
}

// Function to create mail transporter
const createTransporter = async () => {
	try {
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: user,
				clientId: clientId,
				clientSecret: clientSecret,
				refreshToken: refreshToken,
				accessToken: accessToken,
			},
		});

		return transporter;
	} catch (error) {
		console.error('Error creating transporter:', error);
		throw error;
	}
};

// Function to send emails
const sendEmail = async (email, firstName, companyName, template, role) => {
	try {
		const transporter = await createTransporter();

		const mailOptions = {
			from: user, // Replace with your Gmail
			to: email,
			subject: `Referral for ${role} at ${companyName}`,
			html: template
				.replace('{FirstName}', firstName)
				.replace('{CompanyName}', companyName)
				.replace('{Role}', role),
		};

		await transporter.sendMail(mailOptions);
		console.log(`Email sent to: ${email}`);
	} catch (error) {
		console.error(`Error sending email to ${email}:`, error.message);
	}
};

// Function to process CSV and send emails
const processCSVAndSendEmails = (csvFilePath, emailTemplate) => {
	fs.createReadStream(csvFilePath)
		.pipe(csv())
		.on('data', (row) => {
			const firstName = row['First Name'];
			const email = row['Email'];
			const companyName = company;
			if (email && firstName) {
				sendEmail(email, firstName, companyName, emailTemplate, role);
			} else {
				console.log(`Skipping row due to missing data:`, row);
			}
		})
		.on('end', () => {
			console.log('CSV file processing completed.');
		});
};

// Email template
const emailTemplate = `
<div dir="ltr">
	Hello {FirstName},<br />This is Azhar, a Full Stack Developer.<br />
	I saw that there is an opening for {Role} @ {CompanyName}. I
	think I am a good fit for this position according to the job description. I am
	attaching my resume and LinkedIn profile for your reference. <br />Please refer
	me if possible.<br /><br />
	Thank You!<br />
	Azhar Mahmood<br />
	LinkedIn -
	<a href="https://linkedin.com/in/hithere-devs" target="_blank"
		>https://linkedin.com/in/hithere-devs</a
	><br />
	Github -
	<a href="https://github.com/hithere-devs">https://github.com/hithere-devs</a
	><br />
	Resume -
	<a href="https://drive.google.com/file/d/1TiXyjE4jeqJ-um9DsWftEZEW-tYYBZyi/view">https://drive.google.com/file/d/1TiXyjE4jeqJ-um9DsWftEZEW-tYYBZyi/view</a
	><br />
</div>

`;

// Run the script
const csvFilePath = './data.csv';
processCSVAndSendEmails(csvFilePath, emailTemplate);
