import { google } from "googleapis";
import { JWT, CredentialBody } from "google-auth-library";
import { BotConfig } from "../bot/api/botconfig";

export class GoogleSheets {
    private static SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

    public static async auth(credentials: CredentialBody): Promise<JWT> {
        const auth = new google.auth.GoogleAuth({
            //keyFile: "./config/ip3x-jwt.json",
            credentials: credentials,
            scopes: GoogleSheets.SCOPES
        });
        new google.auth.GoogleAuth({});
        return auth.getClient() as Promise<JWT>;
    }
}
