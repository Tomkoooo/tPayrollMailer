import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

let graphClient: Client | null = null;

/**
 * Initialize Microsoft Graph client with application permissions
 */
export function getGraphClient(): Client {
  if (graphClient) {
    return graphClient;
  }

  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      "Missing Azure AD credentials. Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables."
    );
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  graphClient = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return token?.token || "";
      },
    },
  });

  return graphClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachmentName: string;
  attachmentContent: Buffer;
  fromEmail: string;
}

/**
 * Send email via Microsoft Graph API with attachment
 */
export async function sendEmailViaGraph(
  options: SendEmailOptions
): Promise<void> {
  const client = getGraphClient();
  const { to, subject, body, attachmentName, attachmentContent, fromEmail } =
    options;

  const message = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: attachmentName,
          contentType: "application/pdf",
          contentBytes: attachmentContent.toString("base64"),
        },
      ],
    },
    saveToSentItems: true,
  };

  try {
    await client.api(`/users/${fromEmail}/sendMail`).post(message);
  } catch (error) {
    console.error("Error sending email via Graph:", error);
    throw new Error("Failed to send email via Microsoft Graph");
  }
}
