import { HeartIcon, KeyboardIcon, LanguagesIcon, RadioIcon, SpeakerIcon, TypeIcon } from "lucide-react"

export default function HomeMoreFeatures() {
  const features = [
    { name: "语言翻译", description: "支持中英文互译，更多语言正在开发中。", icon: <LanguagesIcon /> },
    { name: "消息收藏", description: "您可以随时收藏喜欢的消息内容，以便于随时回顾。", icon: <HeartIcon /> },
    { name: "内容阅读", description: "支持将回复内容以语音播报的形式播放。", icon: <SpeakerIcon /> },
    { name: "语音输入", description: "不想打字，没关系，可以直接使用语音来完成输入。", icon: <RadioIcon /> },
    { name: "快捷键", description: "支持快捷键，可以更加方便快捷完成各种操作。", icon: <KeyboardIcon /> },
    { name: "字号调整", description: "支持字号调整，满足不同用户的需求。", icon: <TypeIcon /> },
    {
      name: "内容导出",
      description: "支持将消息内容导出为多种格式文件，方便您随时查阅和分享。",
      icon: <LanguagesIcon />,
    },
    { name: "多端同步", description: "支持多端同步，随时随地享受 AI 带来的生产力提升。", icon: <LanguagesIcon /> },
  ]
  return (
    <div className="flex flex-col gap-20 rounded-xl ">
      <div className="flex flex-col gap-6 text-center">
        <h2 className="text-3xl lg:text-5xl">更多功能</h2>
        <div>我们正在持续完善打磨产品，努力提供一个更完善的生产力工具。</div>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col items-center justify-center gap-4 rounded-xl border p-6 hover:shadow-sm"
            >
              <div className="flex items-center justify-center rounded border p-4">{feature.icon}</div>
              <div className="flex flex-col gap-4 text-center">
                <div className="font-bold">{feature.name}</div>
                <div className="text-sm text-muted-foreground">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}