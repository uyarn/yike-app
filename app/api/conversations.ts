import { commonFetch } from "./common";

/**
 * 获取会话列表
 * @returns
 */
export async function getConversationList(user: string) {
  return commonFetch(`users/${user}/conversations`);
}

/**
 * 创建新的话
 * @returns
 */
export async function createConversation(title: string) {
  return commonFetch("conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

/**
 * 更新对话
 * @returns
 */
export async function updateConversation(
  id: string,
  data: Record<string, any>,
) {
  return commonFetch(`conversations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * 删除对话
 * @returns
 */
export async function deleteConversation(id: string) {
  return commonFetch(`conversations/${id}`, {
    method: "DELETE",
  });
}

/**
 * 用户创建会话对话
 * @returns
 */
export async function createMessage(conversation: string, content: string) {
  return commonFetch(`conversations/${conversation}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * 创建智能对话
 * @returns
 */
export async function createSmartMessage(conversation: string) {
  return commonFetch(`conversations/${conversation}/smart-messages`, {
    method: "POST",
  });
}

/**
 * 获取单个会话的消息列表
 * @returns
 */
export async function getConversationMessageList(conversation: string) {
  return commonFetch(`conversations/${conversation}/messages`);
}