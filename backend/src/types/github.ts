export interface GitHubWebhookPayload {
  action: string;
  pull_request: {
    number: number;
    merged: boolean;
    user: {
      login: string;
      bio?: string;
    };
    labels: Array<{
      name: string;
    }>;
  };
  repository?: {
    full_name: string;
  };
}

export interface GitHubWebhookHeaders {
  'x-hub-signature-256': string;
  'x-github-event': string;
  'x-github-delivery': string;
}

export interface GitHubUser {
  login: string;
  bio: string | null;
}
