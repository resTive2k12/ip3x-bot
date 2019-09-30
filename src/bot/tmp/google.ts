import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function main(): Promise<any> {

    const auth = new google.auth.GoogleAuth({
        keyFile: 'ip3x-jwt.json',
        scopes: SCOPES
    });
    const client = await auth.getClient();

    const sheets = google.sheets({ version: 'v4', auth: client });

    sheets.spreadsheets.get({ spreadsheetId: '1AS0CYbHhMTYO9ogqE8Pxn6N7DJBVPsiAJW05E-K5Uuw' }, (err, res) => {
        if (err) {
            console.log(err);
            return;
        }
        if (res && res.data && res.data.sheets) {
            res.data.sheets.map((sheet) => {
                if (sheet.properties)
                    console.log(sheet.properties.title);
            });
        }
    });

    return;
}

main().catch(console.error);