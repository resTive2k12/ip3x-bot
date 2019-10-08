export interface GoogleCredentials {
    client_email: string;
    private_key: string;
}

export interface Config {
    token: string;
    prefix: string;
    credentials: GoogleCredentials;
}
