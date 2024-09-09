export type CallbackResponse = {
    error: boolean;
    message?: string;
    user_id?: number;
};
  
export function handleSocketCallback(callback: (response: CallbackResponse) => void, error: boolean, message: string, user_id?: number) {
    callback({
        error,
        message,
        user_id,
    });
}
  
export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}