import { useEffect, useState } from "react"
import Locale from "@/locales"
import {
  SubmitKey,
  useActionsStore,
  useBillingStore,
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "@/store"
import { isMobileScreen } from "@/utils"
import classNames from "classnames"
import { SendIcon, StopCircleIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function ChatFooter(props) {
  const { autoScrollBottomRef, inputRef } = props
  const [userInput, setUserInput] = useState("")

  const [config] = useSettingsStore((state) => [state.config])
  const [user, setLoginModalVisible] = useUserStore((state) => [
    state.user,
    state.setLoginModalVisible,
  ])

  const [isStreaming, onUserInput, onUserInputStop, setIsLoadingAnswer] =
    useChatStore((state) => [
      state.isStreaming,
      state.onUserInput,
      state.onUserInputStop,
      state.setIsLoadingAnswer,
    ])

  const [currentCombo] = useBillingStore((state) => [state.currentCombo])

  const [
    mode,
    setMode,
    selectedMessages,
    clearSelectedMessages,
    setExportImageVisible,
  ] = useActionsStore((state) => [
    state.mode,
    state.setMode,
    state.selectedMessages,
    state.clearSelectedMessages,
    state.setExportImageVisible,
  ])

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false
    if (e.key === "Enter" && e.nativeEvent.isComposing) return false
    return (
      (config.chat_submit_key === SubmitKey.AltEnter && e.altKey) ||
      (config.chat_submit_key === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.chat_submit_key === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.chat_submit_key === SubmitKey.MetaEnter && e.metaKey) ||
      (config.chat_submit_key === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    )
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!shouldSubmit(e)) return
    onUserSubmit()
    e.preventDefault()
  }

  const handleStop = () => {
    onUserInputStop()
  }

  // submit user input
  const onUserSubmit = () => {
    // 输出中不允许发送
    if (isStreaming) return
    if (userInput.length <= 0) return

    if (!currentCombo.is_available) {
      toast.error("当前无可用套餐，请购买套餐!")
      location.href = "/pricing"
      return
    }
    setIsLoadingAnswer(true)
    onUserInput(userInput).then(() => setIsLoadingAnswer(false))
    autoScrollBottomRef.current = true
    setUserInput("")
    if (!isMobileScreen()) inputRef.current?.focus()
  }

  const onCancelExport = () => {
    setMode("normal")
    clearSelectedMessages()
  }

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus?.()
  }, [inputRef, user])

  return (
    <div className="sticky bottom-0 p-4 md:p-6">
      {!user.id && (
        <Button
          variant="link"
          className="absolute inset-0 z-10 flex h-full items-center justify-center bg-gray-100/70 text-gray-700 shadow"
          onClick={() => setLoginModalVisible(true)}
        >
          立即登录开始对话
        </Button>
      )}

      <div
        className={classNames(
          "relative flex flex-col items-start gap-2 md:flex-row justify-center",
          {
            hidden: mode !== "normal",
          }
        )}
      >
        <Textarea
          ref={inputRef}
          className="h-10 min-h-[40px] w-full max-w-6xl flex-1 bg-white"
          placeholder={Locale.Chat.Input(config.chat_submit_key)}
          onChange={(e) => setUserInput(e.currentTarget.value)}
          onFocus={() => (autoScrollBottomRef.current = true)}
          onBlur={() => (autoScrollBottomRef.current = true)}
          value={userInput}
          rows={1}
          disabled={!user.id || isStreaming}
          onKeyDown={onInputKeyDown}
          autoFocus={!props.showSideBar}
        />

        {isStreaming ? (
          <Button
            className="flex w-full items-center gap-2 md:w-auto"
            onClick={handleStop}
          >
            <StopCircleIcon size={12} />
            <span>停止生成</span>
          </Button>
        ) : (
          <Button
            className="flex w-full items-center gap-2 md:w-auto"
            onClick={onUserSubmit}
            disabled={!user.id || userInput.length <= 0}
          >
            <SendIcon size={12} />
            <span>发送</span>
          </Button>
        )}
      </div>
      <div
        className={classNames("flex flex-col gap-4 justify-center", {
          hidden: mode !== "select",
        })}
      >
        <div className="text-center text-sm text-gray-400">
          已选择 {selectedMessages.length} 条消息
        </div>
        <div className="flex flex-col justify-center gap-4 md:flex-row">
          <Button
            disabled={!selectedMessages.length}
            onClick={() => setExportImageVisible(true)}
          >
            导出图片
          </Button>
          <Button variant="destructive" onClick={onCancelExport}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}