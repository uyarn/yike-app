"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import {
  CompletionRequest,
  Conversation,
  Message,
  abortCompletion,
  createConversation,
  createMessage,
  deleteConversation,
  getAllMessages,
  getConversations,
  truncateConversation,
} from "@/api/conversations"
import PromptApi, { Prompt } from "@/api/prompts"
import { getCurrentQuota } from "@/api/users"
import useAuth from "@/hooks/use-auth"
import useSettings from "@/hooks/use-settings"
import { isMobileScreen, isScreenSizeAbove } from "@/utils"
import { PanelRightIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import useSWR from "swr"

import { cn } from "@/lib/utils"
import AbortButton from "@/components/chat/abort-button"
import ClearButton from "@/components/chat/clear-button"
import { ConversationList } from "@/components/chat/conversation-list"
import CreateButton from "@/components/chat/create-button"
import DeleteButton from "@/components/chat/delete-button"
import ExportButton from "@/components/chat/export-button"
import ChatInput from "@/components/chat/input"
import MessageExporter from "@/components/chat/message-exporter"
import { MessageList } from "@/components/chat/message-list"
import PromptCard from "@/components/chat/prompt-card"
import BackButton from "@/components/head/back-button"
import LogoButton from "@/components/head/logo-button"
import Loading from "@/components/loading"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ChatPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [prompt, setPrompt] = useState<Prompt>(null)
  const { hasLogged, user, redirectToLogin } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPromptsLoading, setIsPromptsLoading] = useState(false)
  const [conversation, setConversation] = useState<Conversation>(null)
  const [historyTab, setHistoryTab] = useState<"prompt" | "all">("prompt")
  const [messages, setMessages] = useState<Message[]>([])
  const [streamContent, setStreamContent] = useState("")
  const { data: usingPlan } = useSWR(`using-quota`, () => getCurrentQuota())
  const [selectable, setSelectable] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<{ prompt: Conversation[]; all: [] }>({ prompt: [], all: [] })
  let completionRequest = useRef<CompletionRequest>(null)

  const loadConversations = async (tab = historyTab) => {
    setIsPromptsLoading(true)
    const { data } = await getConversations({ prompt: tab === "all" ? "" : (router.query.prompt_id as string) })
    setConversations((conversations) => ({ ...conversations, [tab]: data }))
    setIsPromptsLoading(false)
  }

  const loadPrompt = async () => {
    PromptApi.get(router.query.prompt_id as string).then((res) => {
      setPrompt(res)
    })
  }

  const startWaitResponse = async () => {
    const request = new CompletionRequest(conversation.id)
    if (!completionRequest.current) {
      completionRequest.current = request
    }

    request.onStreaming(async (responseText, done) => {
      if (done) {
        await loadMessages()
      }

      setStreamContent(responseText)
      setIsStreaming(!done)
    })

    await request.start()
  }

  // 获取对话消息列表
  const loadMessages = async () => {
    if (!conversation) {
      return
    }

    const messages = await getAllMessages(conversation.id)
    setMessages(messages)
  }

  // 边栏显示隐藏
  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // 提交问题
  const handleUserSubmit = (input: string) => {
    createMessage(conversation.id, { content: input }).then(loadMessages).then(startWaitResponse)
  }

  // 停止生成回答
  const handleAbortAnswing = async () => {
    completionRequest.current.abort()
    await abortCompletion(conversation.id, streamContent.length)
    await loadMessages()
    setIsStreaming(false)
  }

  // 切换对话
  const handleSelectConversation = (conversation: Conversation) => {
    setConversation(conversation)
  }

  // 清空对话
  const handleTruncateConversation = (conversation: Conversation) => {
    truncateConversation(conversation.id).then(() => setMessages([]))
  }

  // 删除对话
  const handleDeleteConversation = (conversation: Conversation) => {
    deleteConversation(conversation.id).then(() => {
      setConversation(null)
      loadConversations()
    })
  }

  // 切换对话历史记录类型
  const handleChangeConversationHistoryTab = (tab: "prompt" | "all") => {
    setHistoryTab(tab)
    loadConversations()
  }

  // 选择消息的结果
  const handleSelectMessages = (messages: Message[]) => {
    setSelectedMessages(messages)
  }

  // 切换分享模式
  const toggleSelectable = () => {
    if (selectable) {
      setSelectedMessages([])
    }

    setSelectable(!selectable)
  }

  const handleCreateConversation = () => {
    if (!usingPlan) {
      toast.error("当前无可用套餐，请购买套餐!")
      location.href = "/pricing"
      return
    }

    createConversation("新对话")
  }

  // 未登录时，跳转到登录页面
  useEffect(() => {
    if (!hasLogged) {
      redirectToLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLogged, user])

  // 对话列表加载完成后，自动选择第一个对话
  useEffect(() => {
    if (!prompt || conversation) {
      return
    }

    loadConversations().then(() => {
      if (conversations.prompt.length) {
        setConversation(conversations.prompt[0])
      } else {
        createConversation(prompt?.name || "新的聊天", prompt.id).then((res) => {
          loadConversations().then(() => {
            setConversation(res)
          })
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, conversations, prompt])

  // 切换对话时，自动刷新消息
  useEffect(() => {
    if (!conversation) {
      return
    }
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation])

  // 根据屏幕尺寸，自动显示/隐藏边栏
  useEffect(() => {
    setShowSidebar(isScreenSizeAbove("md"))
  }, [])

  // 根据路由参数，自动加载对应的场景
  useEffect(() => {
    if (router.query.prompt_id) {
      loadPrompt().then(() => {
        loadConversations("prompt")
        loadConversations("all")
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.prompt_id])

  if (!hasLogged || !user || !conversation) {
    return <Loading className="min-h-screen" />
  }

  return (
    <main className="relative flex h-screen flex-1 justify-start overflow-y-auto overflow-x-hidden">
      <div
        className={cn("flex h-screen w-[100vw] shrink-0 flex-col overflow-y-auto lg:ml-0 lg:flex-1", {
          "-ml-72": showSidebar,
        })}
      >
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between overflow-hidden border-b bg-white">
          <LogoButton />
          <div className="flex flex-1 gap-6 border-l p-2 md:p-4">
            <div className="flex flex-1 items-center gap-2 md:gap-4">
              <BackButton onClick={() => router.push("/prompts")} />
              <div className="max-w-[45vw] truncate text-lg ">{prompt?.name || "loading..."}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-gray-500">
              {hasLogged && (
                <>
                  <ClearButton onClick={() => handleTruncateConversation(conversation)} />
                  <ExportButton onClick={toggleSelectable} />
                  <DeleteButton onClick={() => handleDeleteConversation(conversation)} />

                  <Button
                    variant="outline"
                    className={cn("flex h-8 w-8 items-center justify-center p-1 hover:bg-primary-100", {
                      "border-primary-300 bg-primary-100": isMobileScreen() && showSidebar,
                    })}
                    title="打开/关闭边栏"
                    onClick={handleToggleSidebar}
                  >
                    <PanelRightIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            selectable={selectable}
            isStreaming={isStreaming}
            streamContent={streamContent}
            onSelect={handleSelectMessages}
          />
        </div>

        {/* 底部输入框 */}
        <footer className="sticky bottom-0 z-10 bg-white p-4 md:p-6 xl:p-12">
          {!selectable && (
            <div className="flex flex-col gap-4">
              {isStreaming && <AbortButton onClick={handleAbortAnswing} />}
              <ChatInput submitKey={settings.chat_submit_key} onSubmit={handleUserSubmit} isStreaming={isStreaming} />
            </div>
          )}

          {/* 导出图片 */}
          {selectable && <MessageExporter messages={selectedMessages} user={user} onCancel={toggleSelectable} />}
        </footer>
      </div>

      {/* 信息边栏 */}
      <aside
        className={cn(
          "sticky top-0 mr-0 flex h-full w-72 shrink-0 flex-col gap-6 overflow-hidden border-l bg-white p-6 text-gray-700 transition-all delay-75",
          {
            "-mr-72": !showSidebar,
          }
        )}
      >
        {prompt && <PromptCard prompt={prompt} />}

        <div className="border-t"></div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <Label className="shink-0">对话历史</Label>
          <Tabs
            onValueChange={handleChangeConversationHistoryTab}
            value={historyTab}
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <TabsList className="grid shrink-0 grid-cols-2 bg-primary-50">
              <TabsTrigger value="prompt">
                <div className="flex items-center gap-1">
                  <span>当前场景</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="all">
                <div className="flex items-center gap-1">
                  <span>全部场景</span>
                </div>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="flex-1 overflow-y-auto">
              {isPromptsLoading && conversations.prompt.length <= 0 && <Loading className="h-32" />}
              <ConversationList
                selectedId={conversation?.id}
                conversations={conversations.prompt}
                onSelect={handleSelectConversation}
              />
            </TabsContent>
            <TabsContent value="all" className="flex-1 overflow-y-auto">
              {isPromptsLoading && conversations.all.length <= 0 && <Loading className="h-32" />}
              <ConversationList
                selectedId={conversation?.id}
                conversations={conversations.all}
                onSelect={handleSelectConversation}
              />
            </TabsContent>
          </Tabs>

          <CreateButton onClick={handleCreateConversation} />
        </div>
      </aside>
    </main>
  )
}
