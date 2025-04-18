import { v4 as uuidv4 } from 'uuid';

const CHAT_ID_KEY = 'current_chat_id';

export const getOrCreateChatId = (): string => {
  let chatId = localStorage.getItem(CHAT_ID_KEY);
  
  if (!chatId) {
    chatId = uuidv4();
    localStorage.setItem(CHAT_ID_KEY, chatId);
  }
  
  return chatId;
};

export const clearChatId = (): void => {
  localStorage.removeItem(CHAT_ID_KEY);
};


export const renewChatId = (): string => {
  clearChatId();
  return getOrCreateChatId();
};
