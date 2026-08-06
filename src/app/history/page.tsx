import type { Metadata } from "next";

import { HistoryPageContent } from "./HistoryPageContent";

export const metadata: Metadata = {
  title: "生成历史",
  description: "查看电商视觉生成任务的历史记录和输出资产。",
};

export default function HistoryPage() {
  return <HistoryPageContent />;
}
