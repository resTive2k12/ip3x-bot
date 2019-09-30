import { google } from "googleapis";
import { JWT } from "google-auth-library";

export class GoogleSheets {
    private static SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

    public static async auth(): Promise<JWT> {
        const auth = new google.auth.GoogleAuth({
            keyFile: "ip3x-jwt.json",
            scopes: GoogleSheets.SCOPES
        });

        return auth.getClient() as Promise<JWT>;
    }
}
