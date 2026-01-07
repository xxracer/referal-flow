
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    const { path, operation } = context;
    const message = `Firestore Permission Denied: Operation '${operation}' on path '${path}' was blocked by security rules.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is to make the error visible in the Next.js dev overlay
    this.stack = JSON.stringify({
        message: 'The following request was denied by Firestore Security Rules:',
        details: {
            auth: 'No user authenticated. `request.auth` is null.',
            ...this.context,
        },
    }, null, 2);
  }
}
