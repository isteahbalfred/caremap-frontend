import api from "./api"; // adapte si ton instance axios s'appelle/se trouve différemment (comme dans adminService.ts)

export const chatService = {
  send: (message: string) => api.post("/chat", { message }),
};